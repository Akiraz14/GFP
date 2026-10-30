import type { SqlDatabase } from '../../infrastructure/database/sqlDatabase';
import { IdentityRepository } from '../../infrastructure/database/repositories/identityRepository';
import type { Pbkdf2Engine } from '../../infrastructure/security/pbkdf2Engine';
import {
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';
import {
  EMPTY_THROTTLE_STATE,
  RECOVERY_THROTTLE_POLICY,
  isLocked,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  type ThrottlePolicy,
} from './attemptThrottle';
import { LOGIN_THROTTLE_SUBJECT } from './accountLogin';
import { validateNewPassword, type PasswordViolation } from './passwordPolicy';
import { emailError } from './registrationValidation';
import { serializedByDatabase } from '../databaseQueue';
import {
  createSecretVerifier,
  verifySecret,
  type VerifierParameters,
} from './secretVerifier';
import {
  pickRecoveryQuestions,
  RECOVERY_QUESTION_COUNT,
  type SecurityAnswerInput,
  type SecurityQuestion,
} from './securityQuestionPolicy';

export const RECOVERY_CHALLENGE_TTL_MS = 15 * 60_000;
export const UNKNOWN_IDENTIFIER_SUBJECT = 'unknown-identifier';

export type RecoveryIdentifierError = 'required' | 'identifier_format';

export type RecoveryStartResult =
  | { status: 'challenge'; questionIds: [string, string] }
  | { status: 'invalid_identifier' }
  | { status: 'phone_country_code_required' }
  | { status: 'locked'; retryAfterMs: number }
  | { status: 'failed' };

export type RecoveryCompletionResult =
  | { status: 'password_updated' }
  | { status: 'invalid_data' }
  | { status: 'password_rejected'; violations: PasswordViolation[] }
  | { status: 'confirmation_mismatch' }
  | { status: 'challenge_expired' }
  | { status: 'locked'; retryAfterMs: number }
  | { status: 'failed' };

export interface RecoveryGateway {
  listSecurityQuestions(): Promise<SecurityQuestion[]>;
  start(identifier: string): Promise<RecoveryStartResult>;
  complete(
    identifier: string,
    answers: readonly SecurityAnswerInput[],
    newPassword: string,
    confirmation: string,
  ): Promise<RecoveryCompletionResult>;
}

export function validateRecoveryIdentifier(
  identifier: string,
): RecoveryIdentifierError | null {
  const trimmed = identifier.trim();
  if (trimmed.length === 0) {
    return 'required';
  }
  return trimmed.includes('@') && emailError(trimmed) !== null
    ? 'identifier_format'
    : null;
}

export type AccountRecoveryDependencies = {
  database: SqlDatabase;
  engine: Pbkdf2Engine;
  random?: RandomBytesSource;
  now?: () => number;
  policy?: ThrottlePolicy;
  parameters?: VerifierParameters;
};

export class AccountRecoveryService implements RecoveryGateway {
  private readonly random: RandomBytesSource;
  private readonly now: () => number;
  private readonly policy: ThrottlePolicy;

  constructor(private readonly dependencies: AccountRecoveryDependencies) {
    this.random = dependencies.random ?? secureRandomBytes;
    this.now = dependencies.now ?? Date.now;
    this.policy = dependencies.policy ?? RECOVERY_THROTTLE_POLICY;
  }

  private repository(): IdentityRepository {
    return new IdentityRepository(this.dependencies.database);
  }

  private async lockState(repository: IdentityRepository, subject: string) {
    return (
      (await repository.getThrottle('recovery', subject)) ??
      EMPTY_THROTTLE_STATE
    );
  }

  private async recordFailure(
    repository: IdentityRepository,
    subject: string,
  ): Promise<void> {
    const state = await this.lockState(repository, subject);
    await repository.saveThrottle(
      'recovery',
      subject,
      registerFailure(state, this.policy, this.now()),
    );
  }

  listSecurityQuestions(): Promise<SecurityQuestion[]> {
    return this.repository().getSecurityQuestionCatalog();
  }

  async start(identifier: string): Promise<RecoveryStartResult> {
    if (validateRecoveryIdentifier(identifier) !== null) {
      return { status: 'invalid_identifier' };
    }
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.startSerialized(identifier),
      );
    } catch {
      return { status: 'failed' };
    }
  }

  async complete(
    identifier: string,
    answers: readonly SecurityAnswerInput[],
    newPassword: string,
    confirmation: string,
  ): Promise<RecoveryCompletionResult> {
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.completeSerialized(identifier, answers, newPassword, confirmation),
      );
    } catch {
      return { status: 'failed' };
    }
  }

  private async startSerialized(
    identifier: string,
  ): Promise<RecoveryStartResult> {
    const repository = this.repository();
    const now = this.now();
    const unknownState = await this.lockState(
      repository,
      UNKNOWN_IDENTIFIER_SUBJECT,
    );
    if (isLocked(unknownState, now)) {
      return {
        status: 'locked',
        retryAfterMs: remainingLockMs(unknownState, now),
      };
    }
    const lookup = await repository.lookupIdentifier(identifier);
    if (lookup.status === 'phone_country_code_required') {
      return { status: 'phone_country_code_required' };
    }
    if (lookup.status === 'not_found') {
      await this.recordFailure(repository, UNKNOWN_IDENTIFIER_SUBJECT);
      return { status: 'invalid_identifier' };
    }
    const userId = lookup.userId;
    const state = await this.lockState(repository, userId);
    if (isLocked(state, now)) {
      return { status: 'locked', retryAfterMs: remainingLockMs(state, now) };
    }
    const existing = await repository.getRecoveryChallenge(userId);
    if (existing !== null && existing.expiresAt > now) {
      return { status: 'challenge', questionIds: existing.questionIds };
    }
    const picked = pickRecoveryQuestions(
      await repository.getConfiguredQuestionIds(userId),
      this.random,
    );
    const questionIds: [string, string] = [picked[0], picked[1]];
    await repository.saveRecoveryChallenge({
      userId,
      questionIds,
      createdAt: now,
      expiresAt: now + RECOVERY_CHALLENGE_TTL_MS,
    });
    return { status: 'challenge', questionIds };
  }

  private async completeSerialized(
    identifier: string,
    answers: readonly SecurityAnswerInput[],
    newPassword: string,
    confirmation: string,
  ): Promise<RecoveryCompletionResult> {
    const violations = validateNewPassword(newPassword);
    if (violations.length > 0) {
      return { status: 'password_rejected', violations };
    }
    if (newPassword !== confirmation) {
      return { status: 'confirmation_mismatch' };
    }
    const engine = this.dependencies.engine;
    const repository = this.repository();
    const now = this.now();
    const userId = await repository.findUserIdByIdentifier(identifier);
    if (userId === null) {
      return { status: 'invalid_data' };
    }
    const state = await this.lockState(repository, userId);
    if (isLocked(state, now)) {
      return { status: 'locked', retryAfterMs: remainingLockMs(state, now) };
    }
    const challenge = await repository.getRecoveryChallenge(userId);
    if (challenge === null || challenge.expiresAt <= now) {
      return { status: 'challenge_expired' };
    }
    let allCorrect = answers.length === RECOVERY_QUESTION_COUNT;
    for (const questionId of challenge.questionIds) {
      const answer = answers.find(
        candidate => candidate.questionId === questionId,
      );
      const record = await repository.getSecurityAnswer(userId, questionId);
      if (record === null) {
        allCorrect = false;
        continue;
      }
      const correct = await verifySecret(answer?.answer ?? '', record, engine);
      allCorrect = allCorrect && answer !== undefined && correct;
    }
    if (!allCorrect) {
      await this.recordFailure(repository, userId);
      return { status: 'invalid_data' };
    }
    const credential = await createSecretVerifier(newPassword, 'nfc', {
      engine,
      random: this.random,
      parameters: this.dependencies.parameters,
    });
    await this.dependencies.database.transaction(async executor => {
      const transactional = new IdentityRepository(executor);
      await transactional.replaceCredential(userId, credential, now);
      await transactional.deleteRecoveryChallenge(userId);
      await transactional.saveThrottle('recovery', userId, registerSuccess());
      await transactional.saveThrottle(
        'login',
        LOGIN_THROTTLE_SUBJECT,
        registerSuccess(),
      );
    });
    return { status: 'password_updated' };
  }
}

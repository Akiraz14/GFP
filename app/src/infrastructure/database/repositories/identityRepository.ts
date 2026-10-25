import type {
  SecretNormalization,
  SecretVerifierRecord,
} from '../../../services/authentication/secretVerifier';
import type {
  ThrottleScope,
  ThrottleState,
} from '../../../services/authentication/attemptThrottle';
import type { SecurityQuestion } from '../../../services/authentication/securityQuestionPolicy';
import {
  readBlob,
  readInteger,
  readOptionalInteger,
  readText,
  type SqlExecutor,
  type SqlRow,
} from '../sqlDatabase';

export type NewUserProfile = {
  documentTypeCode: string;
  documentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  email: string;
};

export type NewAccount = {
  userId: string;
  profile: NewUserProfile;
  credential: SecretVerifierRecord;
  securityAnswers: ReadonlyArray<{
    questionId: string;
    record: SecretVerifierRecord;
  }>;
};

export type RecoveryChallenge = {
  userId: string;
  questionIds: [string, string];
  createdAt: number;
  expiresAt: number;
};

export class AccountAlreadyRegisteredError extends Error {
  constructor() {
    super('an account already uses this document, email or phone');
    this.name = 'AccountAlreadyRegisteredError';
  }
}

export function normalizeEmail(email: string): string {
  return email.normalize('NFC').trim().toLowerCase();
}

export function normalizeDocumentNumber(documentNumber: string): string {
  return documentNumber.normalize('NFC').trim().toUpperCase();
}

export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

function toVerifierRecord(row: SqlRow): SecretVerifierRecord {
  return {
    algorithm: readText(row, 'algorithm') as SecretVerifierRecord['algorithm'],
    iterations: readInteger(row, 'iterations'),
    formatVersion: readInteger(row, 'format_version'),
    normalization: readText(row, 'normalization') as SecretNormalization,
    salt: readBlob(row, 'salt'),
    verifier: readBlob(row, 'verifier'),
  };
}

export class IdentityRepository {
  constructor(private readonly executor: SqlExecutor) {}

  async findUserIdByIdentifier(identifier: string): Promise<string | null> {
    const trimmed = identifier.trim();
    if (trimmed.length === 0) {
      return null;
    }
    let rows: SqlRow[];
    if (trimmed.includes('@')) {
      rows = (
        await this.executor.execute(
          "SELECT id FROM users WHERE email_normalized = ? AND status = 'active'",
          [normalizeEmail(trimmed)],
        )
      ).rows;
    } else {
      rows = (
        await this.executor.execute(
          "SELECT id FROM users WHERE document_number = ? AND status = 'active'",
          [normalizeDocumentNumber(trimmed)],
        )
      ).rows;
      const digits = normalizePhoneNumber(trimmed);
      if (
        rows.length === 0 &&
        digits.length > 0 &&
        digits === trimmed.replace(/[\s+-]/g, '')
      ) {
        rows = (
          await this.executor.execute(
            "SELECT id FROM users WHERE phone_number = ? AND status = 'active'",
            [digits],
          )
        ).rows;
      }
    }
    return rows.length === 1 ? readText(rows[0], 'id') : null;
  }

  async isAlreadyRegistered(profile: NewUserProfile): Promise<boolean> {
    const result = await this.executor.execute(
      `SELECT count(*) AS total FROM users
        WHERE document_number = ?
           OR email_normalized = ?
           OR (? IS NOT NULL AND phone_country_code = ? AND phone_number = ?)`,
      [
        normalizeDocumentNumber(profile.documentNumber),
        normalizeEmail(profile.email),
        profile.phoneNumber,
        profile.phoneCountryCode,
        profile.phoneNumber === null
          ? null
          : normalizePhoneNumber(profile.phoneNumber),
      ],
    );
    return readInteger(result.rows[0], 'total') > 0;
  }

  async createAccount(account: NewAccount, now: number): Promise<void> {
    if (await this.isAlreadyRegistered(account.profile)) {
      throw new AccountAlreadyRegisteredError();
    }
    const { profile } = account;
    try {
      await this.executor.execute(
        `INSERT INTO users (id, document_type_code, document_number, first_name, middle_name,
           last_name, second_last_name, phone_country_code, phone_number, email,
           email_normalized, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          account.userId,
          profile.documentTypeCode,
          normalizeDocumentNumber(profile.documentNumber),
          profile.firstName,
          profile.middleName,
          profile.lastName,
          profile.secondLastName,
          profile.phoneCountryCode,
          profile.phoneNumber === null
            ? null
            : normalizePhoneNumber(profile.phoneNumber),
          profile.email.trim(),
          normalizeEmail(profile.email),
          now,
          now,
        ],
      );
    } catch (error) {
      if (/UNIQUE constraint failed/i.test(String(error))) {
        throw new AccountAlreadyRegisteredError();
      }
      throw error;
    }
    await this.replaceCredential(account.userId, account.credential, now);
    for (const answer of account.securityAnswers) {
      await this.executor.execute(
        `INSERT INTO security_answers (user_id, question_id, algorithm, iterations, salt,
           verifier, normalization, format_version, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          account.userId,
          answer.questionId,
          answer.record.algorithm,
          answer.record.iterations,
          answer.record.salt,
          answer.record.verifier,
          answer.record.normalization,
          answer.record.formatVersion,
          now,
        ],
      );
    }
  }

  async getCredential(userId: string): Promise<SecretVerifierRecord | null> {
    const result = await this.executor.execute(
      'SELECT * FROM credentials WHERE user_id = ?',
      [userId],
    );
    return result.rows.length === 1 ? toVerifierRecord(result.rows[0]) : null;
  }

  async replaceCredential(
    userId: string,
    record: SecretVerifierRecord,
    now: number,
  ): Promise<void> {
    await this.executor.execute(
      `INSERT INTO credentials (user_id, algorithm, iterations, salt, verifier, normalization,
         format_version, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET algorithm = excluded.algorithm,
         iterations = excluded.iterations, salt = excluded.salt, verifier = excluded.verifier,
         normalization = excluded.normalization, format_version = excluded.format_version,
         updated_at = excluded.updated_at`,
      [
        userId,
        record.algorithm,
        record.iterations,
        record.salt,
        record.verifier,
        record.normalization,
        record.formatVersion,
        now,
      ],
    );
  }

  async getConfiguredQuestionIds(userId: string): Promise<string[]> {
    const result = await this.executor.execute(
      'SELECT question_id FROM security_answers WHERE user_id = ? ORDER BY question_id',
      [userId],
    );
    return result.rows.map(row => readText(row, 'question_id'));
  }

  async getSecurityAnswer(
    userId: string,
    questionId: string,
  ): Promise<SecretVerifierRecord | null> {
    const result = await this.executor.execute(
      'SELECT * FROM security_answers WHERE user_id = ? AND question_id = ?',
      [userId, questionId],
    );
    return result.rows.length === 1 ? toVerifierRecord(result.rows[0]) : null;
  }

  async getSecurityQuestionCatalog(): Promise<SecurityQuestion[]> {
    const questions = await this.executor.execute(
      'SELECT id, similarity_group FROM security_questions WHERE is_active = 1 ORDER BY sort_order',
    );
    const options = await this.executor.execute(
      'SELECT question_id, id FROM security_question_options ORDER BY question_id, sort_order',
    );
    return questions.rows.map(row => {
      const id = readText(row, 'id');
      return {
        id,
        similarityGroup: readText(row, 'similarity_group'),
        optionIds: options.rows
          .filter(option => readText(option, 'question_id') === id)
          .map(option => readText(option, 'id')),
      };
    });
  }

  async getThrottle(
    scope: ThrottleScope,
    subject: string,
  ): Promise<ThrottleState | null> {
    const result = await this.executor.execute(
      'SELECT * FROM auth_throttles WHERE scope = ? AND subject = ?',
      [scope, subject],
    );
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      failureCount: readInteger(row, 'failure_count'),
      lockLevel: readInteger(row, 'lock_level'),
      lockedUntil: readOptionalInteger(row, 'locked_until'),
      lastFailureAt: readOptionalInteger(row, 'last_failure_at'),
    };
  }

  async saveThrottle(
    scope: ThrottleScope,
    subject: string,
    state: ThrottleState,
  ): Promise<void> {
    await this.executor.execute(
      `INSERT INTO auth_throttles (scope, subject, failure_count, lock_level, locked_until,
         last_failure_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (scope, subject) DO UPDATE SET failure_count = excluded.failure_count,
         lock_level = excluded.lock_level, locked_until = excluded.locked_until,
         last_failure_at = excluded.last_failure_at`,
      [
        scope,
        subject,
        state.failureCount,
        state.lockLevel,
        state.lockedUntil,
        state.lastFailureAt,
      ],
    );
  }

  async getRecoveryChallenge(
    userId: string,
  ): Promise<RecoveryChallenge | null> {
    const result = await this.executor.execute(
      'SELECT * FROM recovery_challenges WHERE user_id = ?',
      [userId],
    );
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      userId,
      questionIds: [
        readText(row, 'first_question_id'),
        readText(row, 'second_question_id'),
      ],
      createdAt: readInteger(row, 'created_at'),
      expiresAt: readInteger(row, 'expires_at'),
    };
  }

  async saveRecoveryChallenge(challenge: RecoveryChallenge): Promise<void> {
    await this.executor.execute(
      `INSERT INTO recovery_challenges (user_id, first_question_id, second_question_id,
         created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET first_question_id = excluded.first_question_id,
         second_question_id = excluded.second_question_id, created_at = excluded.created_at,
         expires_at = excluded.expires_at`,
      [
        challenge.userId,
        challenge.questionIds[0],
        challenge.questionIds[1],
        challenge.createdAt,
        challenge.expiresAt,
      ],
    );
  }

  async deleteRecoveryChallenge(userId: string): Promise<void> {
    await this.executor.execute(
      'DELETE FROM recovery_challenges WHERE user_id = ?',
      [userId],
    );
  }
}

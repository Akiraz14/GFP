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
  classifyLoginIdentifier,
  normalizeDocumentNumber,
  normalizeEmail,
  phoneDigits,
  toE164,
} from '../../../services/authentication/identifiers';
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
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
};

export type RegistrationIdentifiers = Pick<
  NewUserProfile,
  'documentNumber' | 'phoneCountryCode' | 'phoneNumber' | 'email'
>;

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

export type DocumentType = { code: string; name: string };

export type IdentifierLookup =
  | { status: 'found'; userId: string }
  | { status: 'not_found' }
  | { status: 'phone_country_code_required' };

export class AccountAlreadyRegisteredError extends Error {
  constructor() {
    super('an account already uses this document, email or phone');
    this.name = 'AccountAlreadyRegisteredError';
  }
}

export class InactiveDocumentTypeError extends Error {
  constructor() {
    super('the document type is not active');
    this.name = 'InactiveDocumentTypeError';
  }
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

function userIds(rows: SqlRow[]): string[] {
  return rows.map(row => readText(row, 'id'));
}

export class IdentityRepository {
  constructor(private readonly executor: SqlExecutor) {}

  async lookupIdentifier(identifier: string): Promise<IdentifierLookup> {
    const parsed = classifyLoginIdentifier(identifier);
    let ids: string[] = [];
    if (parsed.kind === 'email') {
      ids = userIds(
        (
          await this.executor.execute(
            "SELECT id FROM users WHERE email_normalized = ? AND status = 'active'",
            [parsed.email],
          )
        ).rows,
      );
    } else if (parsed.kind === 'e164') {
      ids = userIds(
        (
          await this.executor.execute(
            "SELECT id FROM users WHERE phone_e164 = ? AND status = 'active'",
            [parsed.phone],
          )
        ).rows,
      );
    } else if (parsed.kind === 'document_or_phone') {
      ids = userIds(
        (
          await this.executor.execute(
            `SELECT id FROM users
              WHERE status = 'active'
                AND (document_number_normalized = ? OR phone_number = ?)`,
            [parsed.document, parsed.nationalNumber],
          )
        ).rows,
      );
    }
    const distinct = [...new Set(ids)];
    if (distinct.length === 1) {
      return { status: 'found', userId: distinct[0] };
    }
    return distinct.length === 0
      ? { status: 'not_found' }
      : { status: 'phone_country_code_required' };
  }

  async findUserIdByIdentifier(identifier: string): Promise<string | null> {
    const lookup = await this.lookupIdentifier(identifier);
    return lookup.status === 'found' ? lookup.userId : null;
  }

  async isAlreadyRegistered(
    identifiers: RegistrationIdentifiers,
  ): Promise<boolean> {
    const document = normalizeDocumentNumber(identifiers.documentNumber);
    const nationalNumber = phoneDigits(identifiers.phoneNumber);
    const e164 = toE164(identifiers.phoneCountryCode, identifiers.phoneNumber);
    const result = await this.executor.execute(
      `SELECT count(*) AS total FROM users
        WHERE document_number_normalized IN (?, ?, ?)
           OR email_normalized = ?
           OR phone_e164 IN (?, ?)
           OR phone_number = ?`,
      [
        document,
        nationalNumber,
        e164,
        normalizeEmail(identifiers.email),
        e164,
        document,
        document,
      ],
    );
    return readInteger(result.rows[0], 'total') > 0;
  }

  async listActiveDocumentTypes(): Promise<DocumentType[]> {
    const result = await this.executor.execute(
      'SELECT code, name FROM document_types WHERE is_active = 1 ORDER BY sort_order',
    );
    return result.rows.map(row => ({
      code: readText(row, 'code'),
      name: readText(row, 'name'),
    }));
  }

  async isActiveDocumentType(code: string): Promise<boolean> {
    const result = await this.executor.execute(
      'SELECT count(*) AS total FROM document_types WHERE code = ? AND is_active = 1',
      [code],
    );
    return readInteger(result.rows[0], 'total') === 1;
  }

  async createAccount(account: NewAccount, now: number): Promise<void> {
    const { profile } = account;
    if (!(await this.isActiveDocumentType(profile.documentTypeCode))) {
      throw new InactiveDocumentTypeError();
    }
    if (await this.isAlreadyRegistered(profile)) {
      throw new AccountAlreadyRegisteredError();
    }
    try {
      await this.executor.execute(
        `INSERT INTO users (id, document_type_code, document_number, document_number_normalized,
           first_name, middle_name, last_name, second_last_name, phone_country_code,
           phone_number, phone_e164, email, email_normalized, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          account.userId,
          profile.documentTypeCode,
          profile.documentNumber.normalize('NFC').trim(),
          normalizeDocumentNumber(profile.documentNumber),
          profile.firstName,
          profile.middleName,
          profile.lastName,
          profile.secondLastName,
          profile.phoneCountryCode,
          phoneDigits(profile.phoneNumber),
          toE164(profile.phoneCountryCode, profile.phoneNumber),
          profile.email.trim(),
          normalizeEmail(profile.email),
          now,
          now,
        ],
      );
    } catch (error) {
      const message = String(error);
      if (/UNIQUE constraint failed|identifier_collision/i.test(message)) {
        throw new AccountAlreadyRegisteredError();
      }
      if (/inactive_document_type/i.test(message)) {
        throw new InactiveDocumentTypeError();
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
      'SELECT id, prompt, similarity_group FROM security_questions WHERE is_active = 1 ORDER BY sort_order',
    );
    return questions.rows.map(row => ({
      id: readText(row, 'id'),
      prompt: readText(row, 'prompt'),
      similarityGroup: readText(row, 'similarity_group'),
    }));
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

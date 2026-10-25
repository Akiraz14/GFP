import {
  PROPOSED_DOCUMENT_TYPES,
  PROPOSED_SECURITY_QUESTIONS,
} from './seedCatalogs';

export type Migration = {
  version: number;
  name: string;
  statements: readonly string[];
};

function quote(text: string): string {
  return `'${text.replace(/'/g, "''")}'`;
}

const SCHEMA_V1: readonly string[] = [
  `CREATE TABLE document_types (
    code TEXT PRIMARY KEY CHECK (length(code) BETWEEN 1 AND 10),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
  ) STRICT`,
  `CREATE TABLE users (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    document_type_code TEXT NOT NULL REFERENCES document_types (code),
    document_number TEXT NOT NULL CHECK (length(document_number) BETWEEN 1 AND 30),
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    second_last_name TEXT,
    phone_country_code TEXT,
    phone_number TEXT,
    email TEXT NOT NULL,
    email_normalized TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CHECK ((phone_country_code IS NULL) = (phone_number IS NULL))
  ) STRICT`,
  'CREATE UNIQUE INDEX ux_users_document_number ON users (document_number)',
  'CREATE UNIQUE INDEX ux_users_email_normalized ON users (email_normalized)',
  `CREATE UNIQUE INDEX ux_users_phone ON users (phone_country_code, phone_number)
    WHERE phone_number IS NOT NULL`,
  `CREATE TABLE credentials (
    user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    algorithm TEXT NOT NULL CHECK (algorithm = 'pbkdf2-hmac-sha256'),
    iterations INTEGER NOT NULL CHECK (iterations BETWEEN 1 AND 10000000),
    salt BLOB NOT NULL CHECK (length(salt) = 16),
    verifier BLOB NOT NULL CHECK (length(verifier) = 32),
    normalization TEXT NOT NULL CHECK (normalization = 'nfc'),
    format_version INTEGER NOT NULL CHECK (format_version >= 1),
    updated_at INTEGER NOT NULL
  ) STRICT`,
  `CREATE TABLE security_questions (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    similarity_group TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
  ) STRICT`,
  `CREATE TABLE security_question_options (
    question_id TEXT NOT NULL REFERENCES security_questions (id),
    id TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (question_id, id),
    UNIQUE (question_id, label)
  ) STRICT`,
  `CREATE TABLE security_answers (
    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES security_questions (id),
    algorithm TEXT NOT NULL CHECK (algorithm = 'pbkdf2-hmac-sha256'),
    iterations INTEGER NOT NULL CHECK (iterations BETWEEN 1 AND 10000000),
    salt BLOB NOT NULL CHECK (length(salt) = 16),
    verifier BLOB NOT NULL CHECK (length(verifier) = 32),
    normalization TEXT NOT NULL CHECK (normalization IN ('option-id', 'free-text-folded')),
    format_version INTEGER NOT NULL CHECK (format_version >= 1),
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, question_id)
  ) STRICT`,
  `CREATE TABLE auth_throttles (
    scope TEXT NOT NULL CHECK (scope IN ('login', 'recovery')),
    subject TEXT NOT NULL,
    failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
    lock_level INTEGER NOT NULL DEFAULT 0 CHECK (lock_level >= 0),
    locked_until INTEGER,
    last_failure_at INTEGER,
    PRIMARY KEY (scope, subject)
  ) STRICT`,
  `CREATE TABLE recovery_challenges (
    user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    first_question_id TEXT NOT NULL REFERENCES security_questions (id),
    second_question_id TEXT NOT NULL REFERENCES security_questions (id),
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    CHECK (first_question_id <> second_question_id),
    CHECK (expires_at > created_at)
  ) STRICT`,
];

function seedStatements(): string[] {
  const statements: string[] = [];
  PROPOSED_DOCUMENT_TYPES.forEach((type, index) => {
    statements.push(
      `INSERT INTO document_types (code, name, sort_order) VALUES (${quote(
        type.code,
      )}, ${quote(type.name)}, ${index + 1})`,
    );
  });
  PROPOSED_SECURITY_QUESTIONS.forEach((question, questionIndex) => {
    statements.push(
      `INSERT INTO security_questions (id, prompt, similarity_group, sort_order) VALUES (${quote(
        question.id,
      )}, ${quote(question.prompt)}, ${quote(question.similarityGroup)}, ${
        questionIndex + 1
      })`,
    );
    question.options.forEach((option, optionIndex) => {
      statements.push(
        `INSERT INTO security_question_options (question_id, id, label, sort_order) VALUES (${quote(
          question.id,
        )}, ${quote(option.id)}, ${quote(option.label)}, ${optionIndex + 1})`,
      );
    });
  });
  return statements;
}

export const MIGRATIONS: readonly Migration[] = [
  { version: 1, name: 'identity-and-security-schema', statements: SCHEMA_V1 },
  {
    version: 2,
    name: 'proposed-identity-catalogs',
    statements: seedStatements(),
  },
];

import { SYSTEM_CATEGORIES } from './categoryCatalogs';
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
    document_number TEXT NOT NULL CHECK (length(document_number) BETWEEN 1 AND 60),
    document_number_normalized TEXT NOT NULL
      CHECK (length(document_number_normalized) BETWEEN 1 AND 30),
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    second_last_name TEXT,
    phone_country_code TEXT NOT NULL CHECK (
      phone_country_code GLOB '+[1-9]*'
      AND length(phone_country_code) BETWEEN 2 AND 4
      AND substr(phone_country_code, 2) NOT GLOB '*[^0-9]*'
    ),
    phone_number TEXT NOT NULL
      CHECK (length(phone_number) >= 1 AND phone_number NOT GLOB '*[^0-9]*'),
    phone_e164 TEXT NOT NULL CHECK (
      phone_e164 = phone_country_code || phone_number AND length(phone_e164) <= 16
    ),
    email TEXT NOT NULL,
    email_normalized TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  ) STRICT`,
  'CREATE UNIQUE INDEX ux_users_document_number_normalized ON users (document_number_normalized)',
  'CREATE UNIQUE INDEX ux_users_email_normalized ON users (email_normalized)',
  'CREATE UNIQUE INDEX ux_users_phone_e164 ON users (phone_e164)',
  'CREATE INDEX ix_users_phone_number ON users (phone_number)',
  `CREATE TRIGGER tr_users_identifier_collision_insert BEFORE INSERT ON users
    WHEN EXISTS (
      SELECT 1 FROM users other
       WHERE other.id <> NEW.id
         AND (other.phone_number = NEW.document_number_normalized
           OR other.phone_e164 = NEW.document_number_normalized
           OR other.document_number_normalized = NEW.phone_number
           OR other.document_number_normalized = NEW.phone_e164)
    )
    BEGIN SELECT RAISE(ABORT, 'identifier_collision'); END`,
  `CREATE TRIGGER tr_users_identifier_collision_update
    BEFORE UPDATE OF document_number_normalized, phone_number, phone_e164 ON users
    WHEN EXISTS (
      SELECT 1 FROM users other
       WHERE other.id <> NEW.id
         AND (other.phone_number = NEW.document_number_normalized
           OR other.phone_e164 = NEW.document_number_normalized
           OR other.document_number_normalized = NEW.phone_number
           OR other.document_number_normalized = NEW.phone_e164)
    )
    BEGIN SELECT RAISE(ABORT, 'identifier_collision'); END`,
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

const DEACTIVATE_NIT_V3: readonly string[] = [
  "UPDATE document_types SET is_active = 0 WHERE code = 'NIT'",
  `CREATE TRIGGER tr_users_active_document_type_insert BEFORE INSERT ON users
    WHEN NOT EXISTS (
      SELECT 1 FROM document_types
       WHERE code = NEW.document_type_code AND is_active = 1
    )
    BEGIN SELECT RAISE(ABORT, 'inactive_document_type'); END`,
  `CREATE TRIGGER tr_users_active_document_type_update
    BEFORE UPDATE OF document_type_code ON users
    WHEN NOT EXISTS (
      SELECT 1 FROM document_types
       WHERE code = NEW.document_type_code AND is_active = 1
    )
    BEGIN SELECT RAISE(ABORT, 'inactive_document_type'); END`,
];

// HU8 (Etapa 06, E06-D1, E06-D2, E06-D9). Las categorías del sistema no tienen propietario
// (`user_id` nulo) y son compartidas; las personalizadas pertenecen a un usuario. Los
// disparadores protegen las del sistema aunque se use SQL directo (HU8-CA02, HU8-CA07a) y
// evitan que una personalizada repita el nombre de una del sistema (HU8-CA04).
const CATEGORIES_SCHEMA_V4: readonly string[] = [
  `CREATE TABLE categories (
    id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 36),
    user_id TEXT REFERENCES users (id) ON DELETE CASCADE,
    is_system INTEGER NOT NULL CHECK (is_system IN (0, 1)),
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
    name_normalized TEXT NOT NULL CHECK (length(name_normalized) BETWEEN 1 AND 40),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL CHECK (length(icon) BETWEEN 1 AND 30),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CHECK (
      (is_system = 1 AND user_id IS NULL) OR (is_system = 0 AND user_id IS NOT NULL)
    )
  ) STRICT`,
  `CREATE UNIQUE INDEX ux_categories_system_name_normalized
    ON categories (name_normalized) WHERE is_system = 1`,
  `CREATE UNIQUE INDEX ux_categories_user_id_name_normalized
    ON categories (user_id, name_normalized) WHERE user_id IS NOT NULL`,
  'CREATE INDEX ix_categories_user_id ON categories (user_id)',
];

function systemCategoryStatements(): string[] {
  return SYSTEM_CATEGORIES.map(
    (category, index) =>
      `INSERT INTO categories (id, user_id, is_system, name, name_normalized, type, icon, sort_order, created_at, updated_at) VALUES (${quote(
        category.id,
      )}, NULL, 1, ${quote(category.name)}, ${quote(
        category.nameNormalized,
      )}, ${quote(category.type)}, ${quote(category.icon)}, ${
        index + 1
      }, 0, 0)`,
  );
}

// Se crean después de la carga inicial: desde ese momento ninguna categoría del sistema
// puede añadirse, modificarse ni eliminarse.
const CATEGORY_TRIGGERS_V4: readonly string[] = [
  `CREATE TRIGGER tr_categories_system_insert BEFORE INSERT ON categories
    WHEN NEW.is_system = 1
    BEGIN SELECT RAISE(ABORT, 'system_category_protected'); END`,
  `CREATE TRIGGER tr_categories_system_update BEFORE UPDATE ON categories
    WHEN OLD.is_system = 1
    BEGIN SELECT RAISE(ABORT, 'system_category_protected'); END`,
  `CREATE TRIGGER tr_categories_system_delete BEFORE DELETE ON categories
    WHEN OLD.is_system = 1
    BEGIN SELECT RAISE(ABORT, 'system_category_protected'); END`,
  `CREATE TRIGGER tr_categories_owner_update
    BEFORE UPDATE OF user_id, is_system ON categories
    WHEN NEW.user_id IS NOT OLD.user_id OR NEW.is_system <> OLD.is_system
    BEGIN SELECT RAISE(ABORT, 'category_owner_immutable'); END`,
  `CREATE TRIGGER tr_categories_system_name_insert BEFORE INSERT ON categories
    WHEN NEW.is_system = 0 AND EXISTS (
      SELECT 1 FROM categories system
       WHERE system.is_system = 1 AND system.name_normalized = NEW.name_normalized
    )
    BEGIN SELECT RAISE(ABORT, 'category_name_taken'); END`,
  `CREATE TRIGGER tr_categories_system_name_update
    BEFORE UPDATE OF name_normalized ON categories
    WHEN NEW.is_system = 0 AND EXISTS (
      SELECT 1 FROM categories system
       WHERE system.is_system = 1 AND system.name_normalized = NEW.name_normalized
    )
    BEGIN SELECT RAISE(ABORT, 'category_name_taken'); END`,
];

export const MIGRATIONS: readonly Migration[] = [
  { version: 1, name: 'identity-and-security-schema', statements: SCHEMA_V1 },
  {
    version: 2,
    name: 'proposed-identity-catalogs',
    statements: seedStatements(),
  },
  {
    version: 3,
    name: 'deactivate-nit-document-type',
    statements: DEACTIVATE_NIT_V3,
  },
  {
    version: 4,
    name: 'categories-schema-and-system-seed',
    statements: [
      ...CATEGORIES_SCHEMA_V4,
      ...systemCategoryStatements(),
      ...CATEGORY_TRIGGERS_V4,
    ],
  },
];

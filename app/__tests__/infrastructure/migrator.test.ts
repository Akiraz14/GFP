import { MIGRATIONS } from '../../src/infrastructure/database/migrations';
import {
  migrateDatabase,
  MigrationError,
  migrationChecksum,
} from '../../src/infrastructure/database/migrator';
import { readInteger } from '../../src/infrastructure/database/sqlDatabase';
import { createNodeSqliteDatabase } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

describe('schema migrations (E02-D5)', () => {
  test('creates the identity schema and catalogs from an empty database', async () => {
    const database = createNodeSqliteDatabase();
    await expect(migrateDatabase(database, () => 1)).resolves.toBe(2);
    const version = await database.execute('PRAGMA user_version');
    expect(readInteger(version.rows[0], 'user_version')).toBe(2);
    const tables = await database.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.rows.map(row => row.name)).toEqual([
      'auth_throttles',
      'credentials',
      'document_types',
      'recovery_challenges',
      'schema_migrations',
      'security_answers',
      'security_question_options',
      'security_questions',
      'users',
    ]);
    const questions = await database.execute(
      'SELECT count(*) AS total FROM security_questions',
    );
    expect(readInteger(questions.rows[0], 'total')).toBe(10);
  });

  test('is idempotent', async () => {
    const database = await createMigratedDatabase();
    await expect(migrateDatabase(database, () => 2)).resolves.toBe(2);
    const applied = await database.execute(
      'SELECT count(*) AS total FROM schema_migrations',
    );
    expect(readInteger(applied.rows[0], 'total')).toBe(2);
  });

  test('upgrades version 1 to version 2 without losing data', async () => {
    const database = createNodeSqliteDatabase();
    await migrateDatabase(database, () => 1, MIGRATIONS.slice(0, 1));
    await database.execute(
      "INSERT INTO document_types (code, name, sort_order) VALUES ('ZZ', 'Prueba', 99)",
    );
    await expect(migrateDatabase(database, () => 2)).resolves.toBe(2);
    const kept = await database.execute(
      "SELECT name FROM document_types WHERE code = 'ZZ'",
    );
    expect(kept.rows).toEqual([{ name: 'Prueba' }]);
  });

  test('refuses edited migrations and newer schemas', async () => {
    const database = await createMigratedDatabase();
    const edited = [
      {
        ...MIGRATIONS[0],
        statements: [...MIGRATIONS[0].statements, 'SELECT 1'],
      },
      MIGRATIONS[1],
    ];
    await expect(migrateDatabase(database, () => 3, edited)).rejects.toThrow(
      MigrationError,
    );
    await expect(
      migrateDatabase(database, () => 3, MIGRATIONS.slice(0, 1)),
    ).rejects.toMatchObject({
      reason: 'newer_schema',
    });
    expect(migrationChecksum(MIGRATIONS[0])).toMatch(/^[0-9a-f]{64}$/);
  });

  test('rolls back a failing migration completely', async () => {
    const database = await createMigratedDatabase();
    const broken = [
      ...MIGRATIONS,
      {
        version: 3,
        name: 'broken',
        statements: ['CREATE TABLE partial (id TEXT) STRICT', 'INVALID SQL'],
      },
    ];
    await expect(migrateDatabase(database, () => 3, broken)).rejects.toThrow();
    const partial = await database.execute(
      "SELECT count(*) AS total FROM sqlite_master WHERE name = 'partial'",
    );
    expect(readInteger(partial.rows[0], 'total')).toBe(0);
    const version = await database.execute('PRAGMA user_version');
    expect(readInteger(version.rows[0], 'user_version')).toBe(2);
  });

  test('enforces verifier shape, referential integrity and cascades', async () => {
    const database = await createMigratedDatabase();
    const userId = await createAccount(database, profile());
    await expect(
      database.execute(
        `INSERT INTO credentials (user_id, algorithm, iterations, salt, verifier, normalization,
           format_version, updated_at) VALUES (?, 'md5', 1, ?, ?, 'nfc', 1, 1)`,
        [userId, new Uint8Array(16), new Uint8Array(32)],
      ),
    ).rejects.toThrow();
    await expect(
      database.execute(
        "INSERT INTO users (id, document_type_code, document_number, first_name, last_name, email, email_normalized, created_at, updated_at) VALUES ('00000000-0000-4000-8000-000000000000', 'XX', '9', 'A', 'B', 'c@d.co', 'c@d.co', 1, 1)",
      ),
    ).rejects.toThrow(/FOREIGN KEY/);
    await database.execute('DELETE FROM users WHERE id = ?', [userId]);
    for (const table of ['credentials', 'security_answers']) {
      const left = await database.execute(
        `SELECT count(*) AS total FROM ${table}`,
      );
      expect(readInteger(left.rows[0], 'total')).toBe(0);
    }
  });
});

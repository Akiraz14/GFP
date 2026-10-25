import { sha256 } from '@noble/hashes/sha2.js';
import { toHex, utf8Encode } from '../security/encoding';
import { MIGRATIONS, type Migration } from './migrations';
import { readInteger, readText, type SqlDatabase } from './sqlDatabase';

export class MigrationError extends Error {
  readonly reason: 'checksum_mismatch' | 'newer_schema' | 'missing_migration';

  constructor(reason: MigrationError['reason'], version: number) {
    super(`database migration ${version} failed: ${reason}`);
    this.name = 'MigrationError';
    this.reason = reason;
  }
}

export function migrationChecksum(migration: Migration): string {
  return toHex(
    sha256(
      utf8Encode(
        [
          String(migration.version),
          migration.name,
          ...migration.statements,
        ].join('\n;\n'),
      ),
    ),
  );
}

const MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  applied_at INTEGER NOT NULL
) STRICT`;

export async function migrateDatabase(
  database: SqlDatabase,
  now: () => number = Date.now,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<number> {
  await database.execute(MIGRATIONS_TABLE);
  const applied = await database.execute(
    'SELECT version, checksum FROM schema_migrations ORDER BY version',
  );
  const known = new Map(
    migrations.map(migration => [migration.version, migration]),
  );
  const latestKnown = Math.max(
    0,
    ...migrations.map(migration => migration.version),
  );
  let currentVersion = 0;
  for (const row of applied.rows) {
    const version = readInteger(row, 'version');
    const migration = known.get(version);
    if (migration === undefined) {
      throw new MigrationError(
        version > latestKnown ? 'newer_schema' : 'missing_migration',
        version,
      );
    }
    if (readText(row, 'checksum') !== migrationChecksum(migration)) {
      throw new MigrationError('checksum_mismatch', version);
    }
    currentVersion = Math.max(currentVersion, version);
  }
  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }
    if (migration.version !== currentVersion + 1) {
      throw new MigrationError('missing_migration', currentVersion + 1);
    }
    await database.transaction(async executor => {
      for (const statement of migration.statements) {
        await executor.execute(statement);
      }
      await executor.execute(
        'INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)',
        [
          migration.version,
          migration.name,
          migrationChecksum(migration),
          now(),
        ],
      );
      await executor.execute(`PRAGMA user_version = ${migration.version}`);
    });
    currentVersion = migration.version;
  }
  return currentVersion;
}

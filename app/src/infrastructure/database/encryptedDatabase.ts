import { toHex } from '../security/encoding';
import {
  secureRandomBytes,
  type RandomBytesSource,
} from '../security/secureRandom';
import { migrateDatabase } from './migrator';
import type { SqlDatabase } from './sqlDatabase';

export const DATABASE_NAME = 'gfp.db';
export const DATABASE_KEY_BYTES = 32;

const KEY_HEX = /^[0-9a-f]{64}$/;

export interface DatabaseKeyStore {
  read(): Promise<string | null>;
  write(keyHex: string): Promise<void>;
}

export type EncryptedDatabaseDependencies = {
  keyStore: DatabaseKeyStore;
  databaseExists: (name: string) => boolean;
  openDatabase: (name: string, sqlCipherKey: string) => SqlDatabase;
  random?: RandomBytesSource;
  now?: () => number;
};

export type DatabaseOpenFailure =
  | 'key_lost'
  | 'key_rejected'
  | 'key_store_failed'
  | 'cipher_unavailable';

export class DatabaseOpenError extends Error {
  readonly reason: DatabaseOpenFailure;

  constructor(reason: DatabaseOpenFailure) {
    super(`encrypted database could not be opened: ${reason}`);
    this.name = 'DatabaseOpenError';
    this.reason = reason;
  }
}

export function sqlCipherRawKey(keyHex: string): string {
  if (!KEY_HEX.test(keyHex)) {
    throw new DatabaseOpenError('key_store_failed');
  }
  return `x'${keyHex}'`;
}

function isNotADatabase(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /file is not a database|SQLITE_NOTADB|code: 26\b/i.test(message);
}

async function obtainKey(
  dependencies: EncryptedDatabaseDependencies,
  databasePresent: boolean,
): Promise<string> {
  const stored = await dependencies.keyStore.read();
  if (stored !== null) {
    if (!KEY_HEX.test(stored)) {
      throw new DatabaseOpenError(
        databasePresent ? 'key_lost' : 'key_store_failed',
      );
    }
    return stored;
  }
  if (databasePresent) {
    throw new DatabaseOpenError('key_lost');
  }
  const created = toHex(
    (dependencies.random ?? secureRandomBytes)(DATABASE_KEY_BYTES),
  );
  await dependencies.keyStore.write(created);
  if ((await dependencies.keyStore.read()) !== created) {
    throw new DatabaseOpenError('key_store_failed');
  }
  return created;
}

export async function openEncryptedDatabase(
  dependencies: EncryptedDatabaseDependencies,
): Promise<SqlDatabase> {
  const databasePresent = dependencies.databaseExists(DATABASE_NAME);
  const keyHex = await obtainKey(dependencies, databasePresent);
  let database: SqlDatabase | null = null;
  try {
    database = dependencies.openDatabase(
      DATABASE_NAME,
      sqlCipherRawKey(keyHex),
    );
    const cipher = await database.execute('PRAGMA cipher_version');
    const version = cipher.rows[0]?.cipher_version;
    if (typeof version !== 'string' || version.length === 0) {
      throw new DatabaseOpenError('cipher_unavailable');
    }
    await database.execute('SELECT count(*) AS total FROM sqlite_master');
    await database.execute('PRAGMA foreign_keys = ON');
    await migrateDatabase(database, dependencies.now);
    return database;
  } catch (error) {
    try {
      database?.close();
    } catch {
      // El cierre de una conexión fallida no cambia el error que se informa.
    }
    if (error instanceof DatabaseOpenError) {
      throw error;
    }
    if (isNotADatabase(error)) {
      throw new DatabaseOpenError('key_rejected');
    }
    throw error;
  }
}

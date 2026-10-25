import type {
  SqlDatabase,
  SqlExecutor,
  SqlRow,
  SqlValue,
} from '../src/infrastructure/database/sqlDatabase';
import type { Pbkdf2Engine } from '../src/infrastructure/security/pbkdf2Engine';
import { assertPbkdf2Arguments } from '../src/infrastructure/security/pbkdf2Engine';

type NodeStatement = {
  all: (...params: SqlValue[]) => SqlRow[];
  run: (...params: SqlValue[]) => { changes: number | bigint };
};

type NodeDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => NodeStatement;
  close: () => void;
};

type NodeCrypto = {
  pbkdf2Sync: (
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number,
    digest: string,
  ) => Uint8Array;
  randomBytes: (length: number) => Uint8Array;
};

const nodeCrypto = require('node:crypto') as NodeCrypto;

const READS_ROWS = /^\s*(SELECT|PRAGMA|WITH)\b/i;

function toUint8(row: SqlRow): SqlRow {
  const converted: SqlRow = {};
  for (const [column, value] of Object.entries(row)) {
    converted[column] =
      value !== null && typeof value === 'object'
        ? new Uint8Array(value as Uint8Array)
        : value;
  }
  return converted;
}

export function createNodeSqliteDatabase(): SqlDatabase {
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (location: string) => NodeDatabase;
  };
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  let depth = 0;
  const executor: SqlExecutor = {
    async execute(sql, params = []) {
      const statement = database.prepare(sql);
      if (READS_ROWS.test(sql)) {
        return { rows: statement.all(...params).map(toUint8), rowsAffected: 0 };
      }
      const result = statement.run(...params);
      return { rows: [], rowsAffected: Number(result.changes) };
    },
  };
  return {
    execute: executor.execute,
    async transaction(work) {
      if (depth > 0) {
        throw new Error('nested transactions are not supported');
      }
      depth++;
      database.exec('BEGIN');
      try {
        const result = await work(executor);
        database.exec('COMMIT');
        return result;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      } finally {
        depth--;
      }
    },
    close() {
      database.close();
    },
  };
}

export const nodePbkdf2Engine: Pbkdf2Engine = {
  async deriveHmacSha256(password, salt, iterations, keyLengthBytes) {
    assertPbkdf2Arguments(salt, iterations, keyLengthBytes);
    return new Uint8Array(
      nodeCrypto.pbkdf2Sync(
        password,
        salt,
        iterations,
        keyLengthBytes,
        'sha256',
      ),
    );
  },
};

export function nodeRandomBytes(length: number): Uint8Array {
  return new Uint8Array(nodeCrypto.randomBytes(length));
}

export function sequenceRandom(
  values: readonly number[],
): (length: number) => Uint8Array {
  let offset = 0;
  return length => {
    const bytes = new Uint8Array(length);
    for (let index = 0; index < length; index++) {
      bytes[index] = values[offset % values.length];
      offset++;
    }
    return bytes;
  };
}

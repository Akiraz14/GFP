import {
  DatabaseOpenError,
  openEncryptedDatabase,
  sqlCipherRawKey,
  type DatabaseKeyStore,
} from '../../src/infrastructure/database/encryptedDatabase';
import type { SqlDatabase } from '../../src/infrastructure/database/sqlDatabase';
import {
  createNodeSqliteDatabase,
  sequenceRandom,
} from '../../testing/nodeSqliteDatabase';

function memoryKeyStore(
  initial: string | null = null,
): DatabaseKeyStore & { value: string | null } {
  return {
    value: initial,
    async read() {
      return this.value;
    },
    async write(keyHex: string) {
      this.value = keyHex;
    },
  };
}

function cipherDatabase(
  acceptedKey: string | null,
): (name: string, key: string) => SqlDatabase {
  return (_name, key) => {
    const inner = createNodeSqliteDatabase();
    return {
      ...inner,
      async execute(sql, params) {
        if (
          acceptedKey !== null &&
          key !== acceptedKey &&
          !/^PRAGMA cipher_version/.test(sql)
        ) {
          throw new Error(
            '[op-sqlite] SQLite code: 26 execution error: file is not a database',
          );
        }
        if (/^PRAGMA cipher_version/.test(sql)) {
          return {
            rows: [{ cipher_version: '4.19.0 community' }],
            rowsAffected: 0,
          };
        }
        return inner.execute(sql, params);
      },
    };
  };
}

const KEY = 'ab'.repeat(32);

describe('encrypted database opening (E02-D3)', () => {
  test('creates a 256-bit key from the secure source on first run', async () => {
    const keyStore = memoryKeyStore();
    const database = await openEncryptedDatabase({
      keyStore,
      databaseExists: () => false,
      openDatabase: cipherDatabase(null),
      random: sequenceRandom([0xab]),
    });
    expect(keyStore.value).toBe(KEY);
    const tables = await database.execute(
      "SELECT count(*) AS total FROM sqlite_master WHERE name = 'users'",
    );
    expect(tables.rows[0].total).toBe(1);
  });

  test('reuses the stored key on later runs', async () => {
    const keyStore = memoryKeyStore(KEY);
    let usedKey = '';
    await openEncryptedDatabase({
      keyStore,
      databaseExists: () => true,
      openDatabase: (name, key) => {
        usedKey = key;
        return cipherDatabase(null)(name, key);
      },
    });
    expect(usedKey).toBe(sqlCipherRawKey(KEY));
    expect(keyStore.value).toBe(KEY);
  });

  test('never replaces a database whose key is missing', async () => {
    const keyStore = memoryKeyStore();
    const openDatabase = jest.fn();
    await expect(
      openEncryptedDatabase({
        keyStore,
        databaseExists: () => true,
        openDatabase,
      }),
    ).rejects.toMatchObject({ reason: 'key_lost' });
    expect(openDatabase).not.toHaveBeenCalled();
    expect(keyStore.value).toBeNull();
  });

  test('reports a rejected key without touching the file', async () => {
    await expect(
      openEncryptedDatabase({
        keyStore: memoryKeyStore(KEY),
        databaseExists: () => true,
        openDatabase: cipherDatabase(sqlCipherRawKey('cd'.repeat(32))),
      }),
    ).rejects.toMatchObject({ reason: 'key_rejected' });
  });

  test('refuses to run without SQLCipher', async () => {
    await expect(
      openEncryptedDatabase({
        keyStore: memoryKeyStore(KEY),
        databaseExists: () => false,
        openDatabase: () => createNodeSqliteDatabase(),
      }),
    ).rejects.toMatchObject({ reason: 'cipher_unavailable' });
  });

  test('rejects malformed stored keys', async () => {
    await expect(
      openEncryptedDatabase({
        keyStore: memoryKeyStore('not-a-key'),
        databaseExists: () => true,
        openDatabase: cipherDatabase(null),
      }),
    ).rejects.toBeInstanceOf(DatabaseOpenError);
    expect(() => sqlCipherRawKey('ABCD')).toThrow(DatabaseOpenError);
  });
});

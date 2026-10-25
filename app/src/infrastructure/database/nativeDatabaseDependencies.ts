import { open, type DB } from '@op-engineering/op-sqlite';
import {
  getGenericPassword,
  setGenericPassword,
  STORAGE_TYPE,
} from 'react-native-keychain';
import type {
  DatabaseKeyStore,
  EncryptedDatabaseDependencies,
} from './encryptedDatabase';
import { createOpSqliteDatabase } from './opSqliteDatabase';

export const DATABASE_KEY_SERVICE =
  'co.gfpsas.gestionfinanciera.database-key.v1';
const DATABASE_KEY_ACCOUNT = 'gfp-database';

export const keychainDatabaseKeyStore: DatabaseKeyStore = {
  async read() {
    const stored = await getGenericPassword({ service: DATABASE_KEY_SERVICE });
    return stored ? stored.password : null;
  },
  async write(keyHex) {
    const saved = await setGenericPassword(DATABASE_KEY_ACCOUNT, keyHex, {
      service: DATABASE_KEY_SERVICE,
      storage: STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
    if (!saved) {
      throw new Error('database key could not be stored');
    }
  },
};

function databaseExists(name: string): boolean {
  let database: DB | null = null;
  try {
    database = open({ name, failOnCreate: true, readOnly: true });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unable to open database file/i.test(message)) {
      return false;
    }
    throw error;
  } finally {
    try {
      database?.close();
    } catch {
      // Una conexión de solo lectura que no llegó a abrirse no requiere cierre.
    }
  }
}

export function createNativeDatabaseDependencies(): EncryptedDatabaseDependencies {
  return {
    keyStore: keychainDatabaseKeyStore,
    databaseExists,
    openDatabase: (name, sqlCipherKey) =>
      createOpSqliteDatabase(open({ name, encryptionKey: sqlCipherKey })),
  };
}

import { openEncryptedDatabase } from '../infrastructure/database/encryptedDatabase';
import { createNativeDatabaseDependencies } from '../infrastructure/database/nativeDatabaseDependencies';
import { createNativePbkdf2Engine } from '../infrastructure/security/pbkdf2Engine';
import type { AppServices } from './appServices';
import { AccountRegistrationService } from './authentication/accountRegistration';

// Abre y verifica la base cifrada (clave, SQLCipher, migraciones) al iniciar la app
// (A-W9). Cualquier error se propaga sin borrar ni reinicializar la base.
export async function createNativeAppServices(): Promise<AppServices> {
  const database = await openEncryptedDatabase(
    createNativeDatabaseDependencies(),
  );
  return {
    registration: new AccountRegistrationService({
      database,
      engine: createNativePbkdf2Engine(),
    }),
  };
}

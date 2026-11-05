import { CategoryManagementService } from '../business/categories/categoryManagement';
import { MovementManagementService } from '../business/movements/movementManagement';
import { openEncryptedDatabase } from '../infrastructure/database/encryptedDatabase';
import { createNativeDatabaseDependencies } from '../infrastructure/database/nativeDatabaseDependencies';
import { createNativePbkdf2Engine } from '../infrastructure/security/pbkdf2Engine';
import type { AppServices } from './appServices';
import { AccountLoginService } from './authentication/accountLogin';
import { AccountRecoveryService } from './authentication/accountRecovery';
import { AccountRegistrationService } from './authentication/accountRegistration';
import { SessionManager } from './session/sessionManager';

// Abre y verifica la base cifrada (clave, SQLCipher, migraciones) al iniciar la app
// (A-W9). Cualquier error se propaga sin borrar ni reinicializar la base.
export async function createNativeAppServices(): Promise<AppServices> {
  const database = await openEncryptedDatabase(
    createNativeDatabaseDependencies(),
  );
  const engine = createNativePbkdf2Engine();
  const sessions = new SessionManager();
  return {
    registration: new AccountRegistrationService({ database, engine }),
    login: new AccountLoginService({ database, engine, sessions }),
    recovery: new AccountRecoveryService({ database, engine }),
    sessions,
    categories: new CategoryManagementService({ database, sessions }),
    movements: new MovementManagementService({ database, sessions }),
  };
}

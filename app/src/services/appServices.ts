import type { CategoryGateway } from '../business/categories/categoryManagement';
import type { RegistrationGateway } from './authentication/accountRegistration';
import type { LoginGateway } from './authentication/accountLogin';
import type { RecoveryGateway } from './authentication/accountRecovery';
import type { SessionManager } from './session/sessionManager';

export type AppServices = {
  registration: RegistrationGateway;
  login: LoginGateway;
  recovery: RecoveryGateway;
  sessions: SessionManager;
  categories: CategoryGateway;
};

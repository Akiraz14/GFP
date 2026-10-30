import type { RegistrationGateway } from './authentication/accountRegistration';
import type { LoginGateway } from './authentication/accountLogin';
import type { SessionManager } from './session/sessionManager';

export type AppServices = {
  registration: RegistrationGateway;
  login: LoginGateway;
  sessions: SessionManager;
};

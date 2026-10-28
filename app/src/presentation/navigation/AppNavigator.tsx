import { useState } from 'react';
import type { AppServices } from '../../services/appServices';
import type { UserSession } from '../../services/session/sessionManager';
import { LoginScreen } from '../login/LoginScreen';
import { RegistrationWizard } from '../registration/RegistrationWizard';
import { ProvisionalScreen } from '../screens/ProvisionalScreen';
import {
  AUTHENTICATED_HOME_ROUTE,
  INITIAL_ROUTE,
  ROUTE_DEFINITIONS,
  ROUTES,
  type RouteName,
} from './routes';

// Una ruta que exige sesión solo se muestra con la sesión activa del SessionManager; en
// otro caso se muestra el inicio de sesión (HU2-CA10).
export function resolveRoute(
  route: RouteName,
  session: UserSession | null,
  activeSession: UserSession | null,
): RouteName {
  const authenticated = session !== null && session === activeSession;
  return ROUTE_DEFINITIONS[route].requiresSession && !authenticated
    ? ROUTES.login
    : route;
}

export function AppNavigator({ services }: { services: AppServices }) {
  const [route, setRoute] = useState<RouteName>(INITIAL_ROUTE);
  const [session, setSession] = useState<UserSession | null>(null);
  const visible = resolveRoute(route, session, services.sessions.current());
  if (visible === ROUTES.register) {
    return (
      <RegistrationWizard
        gateway={services.registration}
        onNavigate={setRoute}
      />
    );
  }
  if (visible === ROUTES.login) {
    return (
      <LoginScreen
        gateway={services.login}
        onAuthenticated={started => {
          setSession(started);
          setRoute(AUTHENTICATED_HOME_ROUTE);
        }}
        onNavigate={setRoute}
      />
    );
  }
  return <ProvisionalScreen route={ROUTE_DEFINITIONS[visible]} />;
}

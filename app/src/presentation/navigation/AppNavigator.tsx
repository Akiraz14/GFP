import { useState } from 'react';
import type { AppServices } from '../../services/appServices';
import type { UserSession } from '../../services/session/sessionManager';
import { CategoriesScreen } from '../categories/CategoriesScreen';
import { CATEGORY_TEXTS } from '../categories/categoryTexts';
import { LoginScreen } from '../login/LoginScreen';
import { PasswordRecoveryScreen } from '../recovery/PasswordRecoveryScreen';
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
  if (visible === ROUTES.passwordRecovery) {
    return (
      <PasswordRecoveryScreen
        gateway={services.recovery}
        onNavigate={setRoute}
      />
    );
  }
  if (visible === ROUTES.categories && session !== null) {
    return (
      <CategoriesScreen
        gateway={services.categories}
        onBack={() => setRoute(ROUTES.movementHistory)}
        onSessionExpired={() => {
          setSession(null);
          setRoute(ROUTES.login);
        }}
        session={session}
      />
    );
  }
  // Acceso a «Categorías» desde el historial (E06-D4); en la Etapa 08 pasa a la pantalla
  // real del historial.
  const actions =
    visible === ROUTES.movementHistory
      ? [
          {
            label: CATEGORY_TEXTS.buttons.openCategories,
            onPress: () => setRoute(ROUTES.categories),
            testID: 'open-categories',
          },
        ]
      : [];
  return (
    <ProvisionalScreen actions={actions} route={ROUTE_DEFINITIONS[visible]} />
  );
}

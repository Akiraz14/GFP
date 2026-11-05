import { useState, type ReactNode } from 'react';
import {
  NO_MOVEMENT_FILTERS,
  type MovementFilters,
} from '../../infrastructure/database/repositories/movementRepository';
import { AnalysisScreen } from '../analysis/AnalysisScreen';
import { StyleSheet, View } from 'react-native';
import type { AppServices } from '../../services/appServices';
import type { UserSession } from '../../services/session/sessionManager';
import { CategoriesScreen } from '../categories/CategoriesScreen';
import { LoginScreen } from '../login/LoginScreen';
import {
  MovementFormScreen,
  type MovementFormMode,
} from '../movements/MovementFormScreen';
import { MovementHistoryScreen } from '../movements/MovementHistoryScreen';
import { ReceiptCaptureScreen } from '../receipts/ReceiptCaptureScreen';
import { RecommendationsScreen } from '../recommendations/RecommendationsScreen';
import { PasswordRecoveryScreen } from '../recovery/PasswordRecoveryScreen';
import { RegistrationWizard } from '../registration/RegistrationWizard';
import { ProvisionalScreen } from '../screens/ProvisionalScreen';
import { BottomTabBar, type BottomTabRoute } from './BottomTabBar';
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

// Pestaña marcada en la barra inferior: el formulario de HU4 y las categorías de HU8 se
// abren desde «Movimientos» (E08-D4).
function tabOf(route: RouteName): BottomTabRoute {
  return route === ROUTES.financialAnalysis || route === ROUTES.recommendations
    ? route
    : ROUTES.movementHistory;
}

export function AppNavigator({ services }: { services: AppServices }) {
  const [route, setRoute] = useState<RouteName>(INITIAL_ROUTE);
  const [session, setSession] = useState<UserSession | null>(null);
  // Parámetros de HU4: registro nuevo o edición (la edición se abre desde HU5, Etapa 08).
  const [movementForm, setMovementForm] = useState<MovementFormMode>({
    mode: 'create',
  });
  // Filtros con los que se abre el historial desde HU9 o HU10. Cualquier otra entrada al
  // historial lo abre sin filtros.
  const [historyFilters, setHistoryFilters] =
    useState<MovementFilters>(NO_MOVEMENT_FILTERS);
  // Cada navegación abre una pantalla nueva: así el historial aplica sus filtros iniciales
  // aunque ya estuviera abierto (por ejemplo, al pulsar «Movimientos» estando en él).
  const [visit, setVisit] = useState(0);
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
  if (session === null) {
    return <ProvisionalScreen route={ROUTE_DEFINITIONS[visible]} />;
  }
  const expire = () => {
    setSession(null);
    setRoute(ROUTES.login);
  };
  const go = (next: RouteName) => {
    setHistoryFilters(NO_MOVEMENT_FILTERS);
    setVisit(count => count + 1);
    setRoute(next);
  };
  const toHistory = () => go(ROUTES.movementHistory);
  const toFilteredHistory = (filters: MovementFilters) => {
    setHistoryFilters(filters);
    setVisit(count => count + 1);
    setRoute(ROUTES.movementHistory);
  };
  const newMovement = () => {
    setMovementForm({ mode: 'create' });
    go(ROUTES.movementForm);
  };
  let screen: ReactNode;
  if (visible === ROUTES.movementHistory) {
    screen = (
      <MovementHistoryScreen
        categories={services.categories}
        key={visit}
        initialFilters={historyFilters}
        movements={services.movements}
        onEdit={movementId => {
          setMovementForm({ mode: 'edit', movementId });
          setRoute(ROUTES.movementForm);
        }}
        onNewMovement={newMovement}
        onCaptureReceipt={() => setRoute(ROUTES.receiptCapture)}
        onOpenCategories={() => setRoute(ROUTES.categories)}
        onSessionExpired={expire}
        session={session}
      />
    );
  } else if (visible === ROUTES.receiptCapture) {
    screen = (
      <ReceiptCaptureScreen
        gateway={services.receipts}
        onCancel={toHistory}
        onContinue={prefill => {
          setMovementForm({ mode: 'create', prefill });
          setRoute(ROUTES.movementForm);
        }}
      />
    );
  } else if (visible === ROUTES.categories) {
    screen = (
      <CategoriesScreen
        gateway={services.categories}
        onBack={toHistory}
        onSessionExpired={expire}
        session={session}
      />
    );
  } else if (visible === ROUTES.movementForm) {
    screen = (
      <MovementFormScreen
        categories={services.categories}
        movements={services.movements}
        onDone={toHistory}
        onSessionExpired={expire}
        params={movementForm}
        session={session}
      />
    );
  } else if (visible === ROUTES.financialAnalysis) {
    screen = (
      <AnalysisScreen
        gateway={services.movements}
        onNewMovement={newMovement}
        onOpenHistory={toFilteredHistory}
        onSessionExpired={expire}
        session={session}
      />
    );
  } else if (visible === ROUTES.recommendations) {
    screen = (
      <RecommendationsScreen
        gateway={services.recommendations}
        onOpenHistory={toFilteredHistory}
        onSessionExpired={expire}
        session={session}
      />
    );
  } else {
    screen = <ProvisionalScreen route={ROUTE_DEFINITIONS[visible]} />;
  }
  return (
    <View style={styles.layout}>
      <View style={styles.layout}>{screen}</View>
      <BottomTabBar current={tabOf(visible)} onSelect={go} />
    </View>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1 },
});

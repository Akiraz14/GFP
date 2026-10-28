import { useState } from 'react';
import type { AppServices } from '../../services/appServices';
import { RegistrationWizard } from '../registration/RegistrationWizard';
import { ProvisionalScreen } from '../screens/ProvisionalScreen';
import {
  INITIAL_ROUTE,
  ROUTE_DEFINITIONS,
  ROUTES,
  type RouteName,
} from './routes';

export function AppNavigator({ services }: { services: AppServices }) {
  const [route, setRoute] = useState<RouteName>(INITIAL_ROUTE);
  if (route === ROUTES.register) {
    return (
      <RegistrationWizard
        gateway={services.registration}
        onNavigate={setRoute}
      />
    );
  }
  return <ProvisionalScreen route={ROUTE_DEFINITIONS[route]} />;
}

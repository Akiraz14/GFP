import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { AppServices } from '../services/appServices';
import { COLORS } from './components/theme';
import { AppNavigator } from './navigation/AppNavigator';
import { DatabaseErrorScreen } from './screens/DatabaseErrorScreen';

type StartupState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; services: AppServices };

export function AppRoot({
  createServices,
}: {
  createServices: () => Promise<AppServices>;
}) {
  const [state, setState] = useState<StartupState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    createServices().then(
      services => active && setState({ status: 'ready', services }),
      () => active && setState({ status: 'failed' }),
    );
    return () => {
      active = false;
    };
  }, [createServices]);

  if (state.status === 'failed') {
    return <DatabaseErrorScreen />;
  }
  if (state.status === 'loading') {
    return (
      <View style={styles.loading} testID="app-loading">
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }
  return <AppNavigator services={state.services} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});

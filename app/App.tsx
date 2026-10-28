import {
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppRoot } from './src/presentation/AppRoot';
import type { AppServices } from './src/services/appServices';
import { createNativeAppServices } from './src/services/nativeAppServices';

type AppProps = {
  createServices?: () => Promise<AppServices>;
};

function App({ createServices = createNativeAppServices }: AppProps) {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          <View style={styles.container} testID="app-base">
            <AppRoot createServices={createServices} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
});

export default App;

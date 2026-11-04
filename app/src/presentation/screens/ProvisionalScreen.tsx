import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { COLORS } from '../components/theme';
import type { RouteDefinition } from '../navigation/routes';

export type ProvisionalAction = {
  label: string;
  onPress: () => void;
  testID: string;
};

// `actions` permite que una pantalla provisional ofrezca accesos a historias ya
// implementadas; hoy, el botón «Categorías» del historial (E06-D4).
export function ProvisionalScreen({
  route,
  actions = [],
}: {
  route: RouteDefinition;
  actions?: readonly ProvisionalAction[];
}) {
  return (
    <View style={styles.container} testID={`provisional-${route.story}`}>
      <Text accessibilityRole="header" style={styles.title}>
        {route.title}
      </Text>
      <Text style={styles.text}>
        Pantalla provisional: se implementa con {route.story}.
      </Text>
      {actions.map(action => (
        <View key={action.testID} style={styles.action}>
          <ActionButton
            label={action.label}
            onPress={action.onPress}
            testID={action.testID}
            variant="primary"
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  text: {
    color: COLORS.mutedText,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  action: { alignSelf: 'stretch', flexDirection: 'row', marginTop: 24 },
});

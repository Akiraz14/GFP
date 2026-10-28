import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../components/theme';
import type { RouteDefinition } from '../navigation/routes';

export function ProvisionalScreen({ route }: { route: RouteDefinition }) {
  return (
    <View style={styles.container} testID={`provisional-${route.story}`}>
      <Text accessibilityRole="header" style={styles.title}>
        {route.title}
      </Text>
      <Text style={styles.text}>
        Pantalla provisional: se implementa con {route.story}.
      </Text>
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
});

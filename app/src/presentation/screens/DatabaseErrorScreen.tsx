import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../components/theme';
import { DATABASE_OPEN_ERROR_MESSAGE } from '../registration/registrationTexts';

export function DatabaseErrorScreen() {
  return (
    <View style={styles.container} testID="database-error">
      <Text accessibilityRole="alert" style={styles.message}>
        {DATABASE_OPEN_ERROR_MESSAGE}
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
  message: { color: COLORS.error, fontSize: 18, textAlign: 'center' },
});

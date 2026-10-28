import { StyleSheet, Text } from 'react-native';
import { COLORS } from './theme';

export function FieldError({
  message,
  testID,
}: {
  message: string | null;
  testID?: string;
}) {
  if (message === null) {
    return null;
  }
  return (
    <Text accessibilityRole="alert" style={styles.error} testID={testID}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: { color: COLORS.error, fontSize: 14, marginTop: 4 },
});

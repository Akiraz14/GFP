import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { COLORS } from './theme';

export const SECURITY_NOTE_TEXT = 'Datos encriptados con SQLCipher';

// Leyenda verde de los mockups de HU1, HU2 y HU3. El mockup escribe «SQLCypher»; se usa el
// nombre real del producto, SQLCipher.
export function SecurityNote() {
  return (
    <View style={styles.row} testID="security-note">
      <Icon color={COLORS.security} name="shieldCheck" size={16} />
      <Text style={styles.text}>{SECURITY_NOTE_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  text: { color: COLORS.security, fontSize: 13, marginLeft: 6 },
});

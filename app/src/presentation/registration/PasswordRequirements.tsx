import { StyleSheet, Text, View } from 'react-native';
import {
  PASSWORD_REQUIREMENTS,
  unmetPasswordRequirements,
  validateNewPassword,
} from '../../services/authentication/passwordPolicy';
import { COLORS } from '../components/theme';
import { PASSWORD_REQUIREMENT_TEXTS } from './registrationMessages';

type PasswordRequirementsProps = {
  password: string;
  testID: string;
};

export function PasswordRequirements({
  password,
  testID,
}: PasswordRequirementsProps) {
  const unmet = new Set(
    password.length === 0
      ? PASSWORD_REQUIREMENTS
      : unmetPasswordRequirements(validateNewPassword(password)),
  );
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>La contraseña debe tener:</Text>
      {PASSWORD_REQUIREMENTS.map(requirement => {
        const met = !unmet.has(requirement);
        return (
          <Text
            accessibilityLabel={`${PASSWORD_REQUIREMENT_TEXTS[requirement]}: ${
              met ? 'cumplido' : 'pendiente'
            }`}
            key={requirement}
            style={[styles.item, met && styles.met]}
            testID={`${testID}-${requirement}${met ? '-met' : ''}`}
          >
            {`${met ? '✓' : '•'} ${PASSWORD_REQUIREMENT_TEXTS[requirement]}`}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 6 },
  title: { color: COLORS.mutedText, fontSize: 14 },
  item: { color: COLORS.mutedText, fontSize: 14, marginTop: 2 },
  met: { color: COLORS.success },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { COLORS } from './theme';

export type ActionButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'destructive';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ActionButtonVariant;
  icon?: IconName;
  testID?: string;
};

const LABEL_COLORS: Readonly<Record<ActionButtonVariant, string>> = {
  primary: COLORS.primaryText,
  secondary: COLORS.primary,
  danger: COLORS.error,
  destructive: COLORS.primaryText,
};

export function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = 'secondary',
  icon,
  testID,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={[styles.button, styles[variant], disabled && styles.disabled]}
    >
      <View style={styles.content}>
        {icon !== undefined && (
          <View style={styles.icon}>
            <Icon color={LABEL_COLORS[variant]} name={icon} size={18} />
          </View>
        )}
        <Text style={[styles.label, { color: LABEL_COLORS[variant] }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 48,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  content: { alignItems: 'center', flexDirection: 'row' },
  icon: { marginRight: 8 },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.secondary },
  danger: { backgroundColor: COLORS.dangerSoft },
  destructive: { backgroundColor: COLORS.error },
  disabled: { backgroundColor: COLORS.disabled },
  label: { fontSize: 16, fontWeight: '600' },
});

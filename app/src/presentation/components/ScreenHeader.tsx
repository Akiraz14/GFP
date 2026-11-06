import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { COLORS } from './theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onHelp?: () => void;
  disabled?: boolean;
  testID: string;
};

export const HEADER_TEXTS = { back: 'Volver', help: 'Ayuda' } as const;

function RoundButton({
  icon,
  label,
  onPress,
  disabled,
  testID,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled: boolean;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={styles.round}
      testID={testID}
    >
      <Icon
        color={icon === 'help' ? COLORS.primary : COLORS.text}
        name={icon}
        size={20}
      />
    </Pressable>
  );
}

// Encabezado de los mockups de HU1, HU2 y HU3: título centrado, subtítulo debajo y, cuando
// la pantalla los tiene, los botones circulares de regresar y de ayuda.
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  onHelp,
  disabled = false,
  testID,
}: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack !== undefined && (
          <RoundButton
            disabled={disabled}
            icon="arrowLeft"
            label={HEADER_TEXTS.back}
            onPress={onBack}
            testID={`${testID}-back-button`}
          />
        )}
      </View>
      <View style={styles.center}>
        <Text
          accessibilityRole="header"
          style={styles.title}
          testID={`${testID}-title`}
        >
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.side}>
        {onHelp !== undefined && (
          <RoundButton
            disabled={disabled}
            icon="help"
            label={HEADER_TEXTS.help}
            onPress={onHelp}
            testID={`${testID}-help-button`}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  side: { alignItems: 'center', width: 48 },
  center: { alignItems: 'center', flex: 1 },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginTop: 2,
    textAlign: 'center',
  },
  round: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});

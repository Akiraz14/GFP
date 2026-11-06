import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { COLORS } from './theme';

type SectionCardProps = {
  title: string;
  icon: IconName;
  children: ReactNode;
  testID: string;
};

// Grupo visual de los mockups: encabezado con ícono y un recuadro con los controles.
export function SectionCard({
  title,
  icon,
  children,
  testID,
}: SectionCardProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Icon name={icon} size={16} />
        </View>
        <Text accessibilityRole="header" style={styles.title} testID={testID}>
          {title}
        </Text>
      </View>
      <View style={styles.card} testID={`${testID}-card`}>
        {children}
      </View>
    </View>
  );
}

export function IconTitle({
  title,
  icon,
  testID,
}: {
  title: string;
  icon: IconName;
  testID?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.badge}>
        <Icon name={icon} size={16} />
      </View>
      <Text accessibilityRole="header" style={styles.title} testID={testID}>
        {title}
      </Text>
    </View>
  );
}

export const cardStyle = {
  backgroundColor: COLORS.card,
  borderColor: COLORS.cardBorder,
  borderRadius: 12,
  borderWidth: 1,
  padding: 14,
} as const;

const styles = StyleSheet.create({
  section: { marginBottom: 18 },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 10 },
  badge: {
    alignItems: 'center',
    backgroundColor: COLORS.iconBadge,
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    marginRight: 10,
    width: 28,
  },
  title: { color: COLORS.text, flex: 1, fontSize: 17, fontWeight: '700' },
  card: cardStyle,
});

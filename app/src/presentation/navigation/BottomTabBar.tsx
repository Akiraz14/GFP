import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../components/theme';
import { ROUTES, type RouteName } from './routes';

// Barra de navegación inferior de HU4, HU5, HU8, HU9 y HU10 (E08-D4).
export const BOTTOM_TABS = [
  { route: ROUTES.movementHistory, label: 'Movimientos', glyph: '☰' },
  { route: ROUTES.financialAnalysis, label: 'Análisis', glyph: '📈' },
  { route: ROUTES.recommendations, label: 'Recomendaciones', glyph: '☆' },
] as const satisfies readonly {
  route: RouteName;
  label: string;
  glyph: string;
}[];

export type BottomTabRoute = (typeof BOTTOM_TABS)[number]['route'];

export function BottomTabBar({
  current,
  onSelect,
}: {
  current: BottomTabRoute;
  onSelect: (route: BottomTabRoute) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.bar} testID="bottom-tabs">
      {BOTTOM_TABS.map(tab => {
        const selected = tab.route === current;
        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.route}
            onPress={() => onSelect(tab.route)}
            style={styles.tab}
            testID={`tab-${tab.route}`}
          >
            <View style={[styles.glyphBox, selected && styles.glyphSelected]}>
              <Text style={styles.glyph}>{tab.glyph}</Text>
            </View>
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.background,
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: 6,
    paddingTop: 6,
  },
  tab: { alignItems: 'center', flex: 1, minHeight: 48 },
  glyphBox: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2 },
  glyphSelected: { backgroundColor: COLORS.secondary },
  glyph: { color: COLORS.text, fontSize: 18 },
  label: { color: COLORS.mutedText, fontSize: 12, marginTop: 2 },
  labelSelected: { color: COLORS.primary, fontWeight: '700' },
});

import { StyleSheet, Text, View } from 'react-native';
import type { CategoryIconId } from '../../infrastructure/database/categoryCatalogs';
import { COLORS } from '../components/theme';

// Único punto que convierte el identificador de ícono en un glifo (E06-D5, opción a: emoji,
// sin dependencias nuevas). Si se aprueba una biblioteca de íconos, solo cambia este archivo.
export const CATEGORY_ICON_GLYPHS: Record<
  CategoryIconId,
  { glyph: string; label: string }
> = {
  food: { glyph: '🍴', label: 'Cubiertos' },
  car: { glyph: '🚗', label: 'Automóvil' },
  home: { glyph: '🏠', label: 'Casa' },
  gamepad: { glyph: '🎮', label: 'Control de juego' },
  heart: { glyph: '❤️', label: 'Corazón' },
  book: { glyph: '📖', label: 'Libro' },
  'shopping-bag': { glyph: '🛍️', label: 'Bolsa de compras' },
  wallet: { glyph: '👛', label: 'Billetera' },
  more: { glyph: '•••', label: 'Más' },
  cart: { glyph: '🛒', label: 'Carrito' },
  gift: { glyph: '🎁', label: 'Regalo' },
  pet: { glyph: '🐾', label: 'Huella de mascota' },
  dumbbell: { glyph: '🏋️', label: 'Pesa' },
  briefcase: { glyph: '💼', label: 'Maletín' },
  plane: { glyph: '✈️', label: 'Avión' },
};

export function CategoryIcon({
  icon,
  size = 36,
  testID,
}: {
  icon: CategoryIconId;
  size?: number;
  testID?: string;
}) {
  const entry = CATEGORY_ICON_GLYPHS[icon];
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      testID={testID}
    >
      <Text style={[styles.glyph, { fontSize: size * 0.45 }]}>
        {entry.glyph}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
  },
  glyph: { color: COLORS.text },
});

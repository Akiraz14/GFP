import { StyleSheet, View } from 'react-native';
import { COLORS } from './theme';

// Barra de pasos introducida en el registro (Bug 38) y aprobada para conservarse; la
// recuperación de contraseña usa la misma barra.
export function StepProgress({
  steps,
  current,
  testID,
}: {
  steps: number;
  current: number;
  testID: string;
}) {
  return (
    <View importantForAccessibility="no-hide-descendants" style={styles.bar}>
      {Array.from({ length: steps }, (_, offset) => offset + 1).map(index => (
        <View
          key={index}
          style={[styles.segment, index <= current && styles.segmentDone]}
          testID={`${testID}-${index}${index <= current ? '-done' : ''}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', marginBottom: 8, marginTop: 8 },
  segment: {
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    flex: 1,
    height: 4,
    marginHorizontal: 2,
  },
  segmentDone: { backgroundColor: COLORS.primary },
});

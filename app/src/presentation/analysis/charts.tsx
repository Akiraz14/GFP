import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline } from 'react-native-svg';
import type {
  CategoryShare,
  EvolutionPoint,
} from '../../analysis/financialAnalysis';
import { COLORS } from '../components/theme';

// Gráficos de HU9 con react-native-svg (D-04), tomados de daniela888-li/GFP (8bfa533).
// Colores de los segmentos. Después del sexto se repiten en gris.
const SEGMENT_COLORS = [
  '#1F5FBF',
  '#2E9E6B',
  '#E08A1E',
  '#8E5BC4',
  '#D1495B',
  '#2AA6B8',
];
const OTHER_SEGMENT_COLOR = '#B8B8B8';

export function segmentColor(index: number): string {
  return SEGMENT_COLORS[index] ?? OTHER_SEGMENT_COLOR;
}

const DONUT_SIZE = 180;
const DONUT_STROKE = 28;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_LENGTH = 2 * Math.PI * DONUT_RADIUS;

// Dona de HU9: cada segmento es un círculo con trazo parcial (E11-D1).
export function DonutChart({
  shares,
  totalLabel,
  totalValue,
  selectedId,
  onSelect,
}: {
  shares: readonly CategoryShare[];
  totalLabel: string;
  totalValue: string;
  selectedId: string | null;
  onSelect: (share: CategoryShare) => void;
}) {
  const total = shares.reduce((sum, share) => sum + share.totalCents, 0);
  let offset = 0;
  return (
    <View style={styles.donut} testID="analysis-donut">
      <Svg height={DONUT_SIZE} width={DONUT_SIZE}>
        <G rotation={-90} originX={DONUT_SIZE / 2} originY={DONUT_SIZE / 2}>
          {shares.map((share, index) => {
            const length = (share.totalCents / total) * DONUT_LENGTH;
            const dashOffset = -offset;
            offset += length;
            return (
              <Circle
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                fill="none"
                key={share.categoryId}
                onPress={() => onSelect(share)}
                r={DONUT_RADIUS}
                stroke={segmentColor(index)}
                strokeDasharray={`${length} ${DONUT_LENGTH - length}`}
                strokeDashoffset={dashOffset}
                strokeOpacity={
                  selectedId === null || selectedId === share.categoryId
                    ? 1
                    : 0.45
                }
                strokeWidth={DONUT_STROKE}
              />
            );
          })}
        </G>
      </Svg>
      <View pointerEvents="none" style={styles.donutCenter}>
        <Text style={styles.donutLabel}>{totalLabel}</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.donutValue}>
          {totalValue}
        </Text>
      </View>
    </View>
  );
}

const STEP = 64;
const CHART_HEIGHT = 150;
const PADDING = 14;

function pointsOf(
  values: readonly number[],
  max: number,
): { x: number; y: number }[] {
  return values.map((value, index) => ({
    x: PADDING + index * STEP,
    y: PADDING + (1 - value / max) * (CHART_HEIGHT - PADDING * 2),
  }));
}

// Líneas de HU9: Ingresos frente a Gastos en el tiempo.
export function LineChart({ points }: { points: readonly EvolutionPoint[] }) {
  const max = Math.max(
    1,
    ...points.flatMap(point => [point.incomeCents, point.expenseCents]),
  );
  const width = PADDING * 2 + Math.max(points.length - 1, 1) * STEP;
  const series = [
    {
      color: COLORS.success,
      values: pointsOf(
        points.map(point => point.incomeCents),
        max,
      ),
    },
    {
      color: COLORS.error,
      values: pointsOf(
        points.map(point => point.expenseCents),
        max,
      ),
    },
  ];
  return (
    <View testID="analysis-lines">
      <Svg height={CHART_HEIGHT} width={width}>
        {[0, 0.5, 1].map(ratio => {
          const y = PADDING + ratio * (CHART_HEIGHT - PADDING * 2);
          return (
            <Line
              key={ratio}
              stroke={COLORS.disabled}
              strokeWidth={1}
              x1={0}
              x2={width}
              y1={y}
              y2={y}
            />
          );
        })}
        {series.map(({ color, values }) => (
          <G key={color}>
            <Polyline
              fill="none"
              points={values.map(({ x, y }) => `${x},${y}`).join(' ')}
              stroke={color}
              strokeWidth={3}
            />
            {values.map(({ x, y }) => (
              <Circle cx={x} cy={y} fill={color} key={x} r={4} />
            ))}
          </G>
        ))}
      </Svg>
      <View style={[styles.labels, { width }]}>
        {points.map((point, index) => (
          <Text
            key={point.label}
            style={[styles.label, { left: PADDING + index * STEP - STEP / 2 }]}
          >
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  donut: {
    alignItems: 'center',
    alignSelf: 'center',
    height: DONUT_SIZE,
    justifyContent: 'center',
    marginBottom: 14,
    width: DONUT_SIZE,
  },
  donutCenter: {
    alignItems: 'center',
    paddingHorizontal: DONUT_STROKE + 8,
    position: 'absolute',
  },
  donutLabel: { color: COLORS.mutedText, fontSize: 12 },
  donutValue: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  labels: { height: 20 },
  label: {
    color: COLORS.mutedText,
    fontSize: 12,
    position: 'absolute',
    textAlign: 'center',
    width: STEP,
  },
});

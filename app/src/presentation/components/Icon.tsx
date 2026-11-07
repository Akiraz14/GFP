import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { COLORS } from './theme';

export type IconName =
  | 'activity'
  | 'alertTriangle'
  | 'arrowDownLeft'
  | 'arrowLeft'
  | 'arrowUpRight'
  | 'award'
  | 'calendar'
  | 'camera'
  | 'chart'
  | 'clock'
  | 'eye'
  | 'eyeOff'
  | 'flame'
  | 'help'
  | 'idCard'
  | 'info'
  | 'lightbulb'
  | 'lock'
  | 'pieChart'
  | 'plus'
  | 'shield'
  | 'shieldCheck'
  | 'sparkles'
  | 'summary'
  | 'trendingDown'
  | 'trendingUp'
  | 'user';

type Shape =
  | { kind: 'path'; d: string; fill?: boolean }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | {
      kind: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx: number;
    };

const SHIELD = 'M12 3l8 3v6c0 4.6-3.4 7.9-8 9-4.6-1.1-8-4.4-8-9V6z';
const EYE = 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z';

// Outline glyphs on a 24 x 24 grid drawn with react-native-svg (D-04), so the screens
// can show the icons of the mockups without an icon font or a new dependency.
const GLYPHS: Readonly<Record<IconName, readonly Shape[]>> = {
  activity: [{ kind: 'path', d: 'M22 12h-4l-3 9L9 3l-3 9H2' }],
  alertTriangle: [
    { kind: 'path', d: 'M12 3.5L21.5 20h-19z' },
    { kind: 'path', d: 'M12 10v4.5' },
    { kind: 'circle', cx: 12, cy: 17.2, r: 0.9, fill: true },
  ],
  arrowDownLeft: [{ kind: 'path', d: 'M17 7L7 17M16 17H7V8' }],
  arrowLeft: [{ kind: 'path', d: 'M19 12H5M11 18l-6-6 6-6' }],
  arrowUpRight: [{ kind: 'path', d: 'M7 17L17 7M8 7h9v9' }],
  award: [
    { kind: 'circle', cx: 12, cy: 8, r: 6 },
    { kind: 'path', d: 'M15.5 12.9L17 22l-5-3-5 3 1.5-9.1' },
  ],
  calendar: [
    { kind: 'rect', x: 3.5, y: 5, width: 17, height: 15.5, rx: 2 },
    { kind: 'path', d: 'M3.5 10h17M8 3v4M16 3v4' },
  ],
  camera: [
    {
      kind: 'path',
      d: 'M3 8.5A1.5 1.5 0 0 1 4.5 7H8l1.6-2.2h4.8L16 7h3.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z',
    },
    { kind: 'circle', cx: 12, cy: 13, r: 3.6 },
  ],
  chart: [{ kind: 'path', d: 'M3.5 20h17M4.5 16l4.5-5.5 4 3.5 6.5-8' }],
  clock: [
    { kind: 'circle', cx: 12, cy: 12, r: 9.5 },
    { kind: 'path', d: 'M12 6.5V12l3.5 2' },
  ],
  eye: [
    { kind: 'path', d: EYE },
    { kind: 'circle', cx: 12, cy: 12, r: 3 },
  ],
  eyeOff: [
    { kind: 'path', d: EYE },
    { kind: 'circle', cx: 12, cy: 12, r: 3 },
    { kind: 'path', d: 'M4 4l16 16' },
  ],
  flame: [
    {
      kind: 'path',
      d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z',
    },
  ],
  help: [
    { kind: 'circle', cx: 12, cy: 12, r: 9.5 },
    { kind: 'path', d: 'M9.3 9.4a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4' },
    { kind: 'circle', cx: 12, cy: 17.3, r: 0.9, fill: true },
  ],
  idCard: [
    { kind: 'rect', x: 2.5, y: 5, width: 19, height: 14, rx: 2 },
    { kind: 'circle', cx: 8.5, cy: 10.8, r: 2 },
    {
      kind: 'path',
      d: 'M5.5 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4.5M14 14h3.5',
    },
  ],
  info: [
    { kind: 'circle', cx: 12, cy: 12, r: 9.5 },
    { kind: 'path', d: 'M12 11v6' },
    { kind: 'circle', cx: 12, cy: 7.6, r: 0.9, fill: true },
  ],
  lightbulb: [
    {
      kind: 'path',
      d: 'M15 14c.2-1 .7-1.7 1.5-2.5A5 5 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
    },
    { kind: 'path', d: 'M9 18h6M10 22h4' },
  ],
  lock: [
    { kind: 'rect', x: 5, y: 10.5, width: 14, height: 10, rx: 2 },
    { kind: 'path', d: 'M8 10.5V7.5a4 4 0 0 1 8 0v3' },
  ],
  pieChart: [
    { kind: 'path', d: 'M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5v10z' },
    { kind: 'path', d: 'M14 3.2A8 8 0 0 1 20.8 10H14z' },
  ],
  plus: [{ kind: 'path', d: 'M12 5v14M5 12h14' }],
  shield: [{ kind: 'path', d: SHIELD }],
  shieldCheck: [
    { kind: 'path', d: SHIELD },
    { kind: 'path', d: 'M9 12l2.2 2.2L15.5 10' },
  ],
  sparkles: [
    {
      kind: 'path',
      d: 'M10 3l1.7 4.8L16.5 9.5l-4.8 1.7L10 16l-1.7-4.8L3.5 9.5l4.8-1.7z',
    },
    {
      kind: 'path',
      d: 'M18 13.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z',
    },
  ],
  summary: [
    { kind: 'rect', x: 4, y: 3.5, width: 16, height: 17, rx: 2 },
    { kind: 'path', d: 'M8 8.5h8M8 12h8M8 15.5h5' },
  ],
  trendingDown: [{ kind: 'path', d: 'M3 7l6 6 4-4 8 8M15 17h6v-6' }],
  trendingUp: [{ kind: 'path', d: 'M3 17l6-6 4 4 8-8M15 7h6v6' }],
  user: [
    { kind: 'circle', cx: 12, cy: 8, r: 4 },
    { kind: 'path', d: 'M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5' },
  ],
};

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  testID?: string;
};

export function Icon({
  name,
  size = 20,
  color = COLORS.primary,
  testID,
}: IconProps) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      testID={testID ?? `icon-${name}`}
    >
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        {GLYPHS[name].map((shape, index) => {
          const stroke = {
            fill: 'none',
            stroke: color,
            strokeLinecap: 'round' as const,
            strokeLinejoin: 'round' as const,
            strokeWidth: 1.8,
          };
          switch (shape.kind) {
            case 'path':
              return <Path d={shape.d} key={index} {...stroke} />;
            case 'circle':
              return shape.fill ? (
                <Circle
                  cx={shape.cx}
                  cy={shape.cy}
                  fill={color}
                  key={index}
                  r={shape.r}
                />
              ) : (
                <Circle
                  cx={shape.cx}
                  cy={shape.cy}
                  key={index}
                  r={shape.r}
                  {...stroke}
                />
              );
            case 'rect':
              return (
                <Rect
                  height={shape.height}
                  key={index}
                  rx={shape.rx}
                  width={shape.width}
                  x={shape.x}
                  y={shape.y}
                  {...stroke}
                />
              );
          }
        })}
      </Svg>
    </View>
  );
}

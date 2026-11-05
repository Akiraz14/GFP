import { StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '../../business/money/money';
import type { MovementTotals } from '../../infrastructure/database/repositories/movementRepository';
import { COLORS } from '../components/theme';

// Resumen de HU6 en la parte superior del historial. Adaptado de daniela888-li/GFP (a3764a1):
// ingresos en verde, gastos en rojo y balance en azul, o en rojo si es negativo (HU6-CA03).
export const BALANCE_TEXTS = {
  income: 'INGRESOS',
  expense: 'GASTOS',
  balance: 'BALANCE',
} as const;

export function BalanceSummary({ totals }: { totals: MovementTotals | null }) {
  const income = totals?.incomeCents ?? 0;
  const expense = totals?.expenseCents ?? 0;
  const balance = income - expense;
  const blocks = [
    {
      label: BALANCE_TEXTS.income,
      value: income,
      style: styles.income,
      testID: 'balance-income',
    },
    {
      label: BALANCE_TEXTS.expense,
      value: expense,
      style: styles.expense,
      testID: 'balance-expense',
    },
    {
      label: BALANCE_TEXTS.balance,
      value: balance,
      style: balance < 0 ? styles.expense : styles.positive,
      testID: 'balance-total',
    },
  ];
  return (
    <View style={styles.card} testID="balance-summary">
      {blocks.map(block => (
        <View key={block.testID} style={styles.block}>
          <Text style={styles.label}>{block.label}</Text>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.value, block.style]}
            testID={block.testID}
          >
            {totals === null ? '—' : formatMoney(block.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 12,
  },
  block: { alignItems: 'center', flex: 1, paddingHorizontal: 4 },
  label: { color: COLORS.mutedText, fontSize: 12, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '700' },
  income: { color: COLORS.success },
  expense: { color: COLORS.error },
  positive: { color: COLORS.primary },
});

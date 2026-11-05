import { formatMoney } from '../business/money/money';
import type { MovementListItem } from '../infrastructure/database/repositories/movementRepository';
import {
  categoryShares,
  monthRange,
  summarize,
  type DateRange,
} from './financialAnalysis';

// Motor de reglas de HU10, adaptado de daniela888-li/GFP (4c7cd2f). Se ejecuta en el
// dispositivo sobre los movimientos del usuario autenticado. Solo se evalúan las reglas R1, R2 y
// R3 de la historia (plan aprobado); el «Consejo de Ahorro» de la propuesta original no se
// incluye.

// R1 se muestra en naranja y R2 y R3 en rojo, como el prototipo (E-CONS-D6).
export type RecommendationSeverity = 'warning' | 'critical';

export type Recommendation = {
  // Estable por regla y categoría: sirve para descartar la recomendación (I-27).
  id: string;
  rule: 'R1' | 'R2' | 'R3';
  severity: RecommendationSeverity;
  title: string;
  description: string;
  // Datos de origen: período, monto o categoría evaluada (HU10).
  source: string;
  range: DateRange;
  categoryId: string | null;
};

const UNUSUAL_INCREASE = 1.3;
const CRITICAL_SHARE = 0.5;

function within(
  movements: readonly MovementListItem[],
  range: DateRange,
): MovementListItem[] {
  return movements.filter(
    movement =>
      movement.occurredOn >= range.from && movement.occurredOn <= range.to,
  );
}

export function evaluateRecommendations(
  movements: readonly MovementListItem[],
  today: string,
): Recommendation[] {
  const current = monthRange(today);
  const previous = monthRange(today, -1);
  const thisMonth = within(movements, current);
  const lastMonth = within(movements, previous);
  const summary = summarize(thisMonth);
  const shares = categoryShares(thisMonth);
  const result: Recommendation[] = [];

  // R1: la suma de gastos supera la de ingresos en el mes actual.
  if (summary.expenseCents > summary.incomeCents) {
    result.push({
      id: 'negative-balance',
      rule: 'R1',
      severity: 'warning',
      title: 'Regla de Balance Negativo',
      description:
        '¡Cuidado! Tus gastos totales superan tus ingresos en el período actual.',
      source: `Diferencia: ${formatMoney(summary.balanceCents)} - Mes actual`,
      range: current,
      categoryId: null,
    });
  }

  // R2: una sola categoría representa más del 50 % de los gastos del período (mes actual).
  const critical = shares.find(
    share => share.totalCents / summary.expenseCents > CRITICAL_SHARE,
  );
  if (critical !== undefined) {
    result.push({
      id: `critical-category-${critical.categoryId}`,
      rule: 'R2',
      severity: 'critical',
      title: 'Categoría Crítica',
      description: `${critical.name} representa el ${critical.percent}% de tus gastos de este mes.`,
      source: `Monto evaluado: ${formatMoney(
        critical.totalCents,
      )} - Mes actual`,
      range: current,
      categoryId: critical.categoryId,
    });
  }

  // R3: los gastos de una categoría en el mes actual superan en más de 30 % los del mes
  // anterior. Sin gastos de esa categoría en el mes anterior no hay base de comparación.
  const lastShares = new Map(
    categoryShares(lastMonth).map(share => [share.categoryId, share]),
  );
  for (const share of shares) {
    const base = lastShares.get(share.categoryId);
    if (
      base !== undefined &&
      share.totalCents > base.totalCents * UNUSUAL_INCREASE
    ) {
      const increase = Math.round(
        (share.totalCents / base.totalCents - 1) * 100,
      );
      result.push({
        id: `unusual-increase-${share.categoryId}`,
        rule: 'R3',
        severity: 'critical',
        title: '¡Alerta de Gastos Altos!',
        description: `Tus gastos en ${share.name} subieron un ${increase}% este mes en comparación con el anterior.`,
        source: `Monto evaluado: ${formatMoney(share.totalCents)} - Mes actual`,
        range: current,
        categoryId: share.categoryId,
      });
    }
  }
  return result;
}

// Mes de una fecha ISO («2026-11»): período durante el que vale un descarte (I-27).
export function monthOf(today: string): string {
  return today.slice(0, 7);
}

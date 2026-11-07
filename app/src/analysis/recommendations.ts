import { formatMoney } from '../business/money/money';
import type {
  MovementListItem,
  MovementType,
} from '../infrastructure/database/repositories/movementRepository';
import {
  categoryShares,
  comparablePeriods,
  monthRange,
  summarize,
  type DateRange,
} from './financialAnalysis';

// Motor de reglas de HU10, adaptado de daniela888-li/GFP (4c7cd2f). Se ejecuta en el
// dispositivo sobre los movimientos del usuario autenticado. Evalúa las reglas R1, R2 y R3 de
// la historia, el «Consejo de Ahorro» (AJ-04, E-AJ-D1) y las reglas R4 a R8 de la mejora del
// módulo de recomendaciones (docs/recomendaciones-ampliadas.md). No hay metas de ahorro en el
// modelo, así que no se evalúan.

// Rojo para R1, R2 y R3; naranja para R6, R7 y R8; verde para el consejo, R4 y R5.
export type RecommendationSeverity = 'warning' | 'critical' | 'info';

export type RecommendationRule =
  | 'R1'
  | 'R2'
  | 'R3'
  | 'R4'
  | 'R5'
  | 'R6'
  | 'R7'
  | 'R8'
  | 'SAVINGS';

// Otra categoría que cumple la misma regla (R4, R5): se consulta desde la tarjeta.
export type RelatedCategory = {
  categoryId: string;
  name: string;
  detail: string;
};

export type Recommendation = {
  // Estable por regla y categoría: sirve para descartar la recomendación (I-27).
  id: string;
  rule: RecommendationRule;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  // Datos de origen: período, monto o categoría evaluada (HU10).
  source: string;
  // Filtros del historial de «Ver movimientos asociados».
  range: DateRange;
  categoryId: string | null;
  movementType: MovementType | null;
  // R7: período comparable del mes anterior, consultable desde la tarjeta.
  previousRange: DateRange | null;
  relatedCategories: RelatedCategory[];
};

const UNUSUAL_INCREASE = 1.3;
const CRITICAL_SHARE = 0.5;
// Umbrales aprobados de R4 a R7, en porcentaje.
const SPENDING_REDUCTION = 30;
const STABLE_VARIATION = 10;
const EARLY_ALERT_SHARE = 80;
const INCOME_DROP = 20;

function within(
  movements: readonly MovementListItem[],
  range: DateRange,
): MovementListItem[] {
  return movements.filter(
    movement =>
      movement.occurredOn >= range.from && movement.occurredOn <= range.to,
  );
}

// Porcentaje con un decimal. Se redondea hacia el lado del umbral que cumple la regla para no
// mostrar, por ejemplo, «30%» en una reducción que es estrictamente mayor que el 30 %.
function percent(
  numerator: number,
  denominator: number,
  rounding: 'up' | 'down',
): string {
  const tenths = (numerator * 1000) / denominator;
  const value =
    (rounding === 'up' ? Math.ceil(tenths - 1e-9) : Math.floor(tenths + 1e-9)) /
    10;
  return String(value).replace('.', ',');
}

function periodLabel(current: DateRange, previous: DateRange): string {
  const day = Number(current.to.slice(8, 10));
  const previousDay = Number(previous.to.slice(8, 10));
  return day === previousDay
    ? `Días 1 al ${day} de cada mes`
    : `Días 1 al ${day} (mes anterior: 1 al ${previousDay})`;
}

type CategoryComparison = {
  categoryId: string;
  name: string;
  currentCents: number;
  previousCents: number;
};

// Gastos por categoría en los dos períodos equivalentes. Solo entran las categorías con gasto
// en el período anterior: sin él no hay base de comparación. Si el período actual aún no tiene
// gastos no hay información suficiente y no se compara (una reducción del 100 % no estaría
// respaldada por los datos).
function compareCategories(
  current: readonly MovementListItem[],
  previous: readonly MovementListItem[],
): CategoryComparison[] {
  if (!current.some(movement => movement.type === 'expense')) {
    return [];
  }
  const currentTotals = new Map(
    categoryShares(current).map(share => [share.categoryId, share.totalCents]),
  );
  return categoryShares(previous)
    .filter(share => share.totalCents > 0)
    .map(share => ({
      categoryId: share.categoryId,
      name: share.name,
      currentCents: currentTotals.get(share.categoryId) ?? 0,
      previousCents: share.totalCents,
    }));
}

export function evaluateRecommendations(
  movements: readonly MovementListItem[],
  today: string,
): Recommendation[] {
  const current = monthRange(today);
  const previous = monthRange(today, -1);
  const comparable = comparablePeriods(today);
  const thisMonth = within(movements, current);
  const lastMonth = within(movements, previous);
  const comparableNow = within(movements, comparable.current);
  const comparableBefore = within(movements, comparable.previous);
  const summary = summarize(thisMonth);
  const shares = categoryShares(thisMonth);
  const period = periodLabel(comparable.current, comparable.previous);
  const result: Recommendation[] = [];
  const base = {
    range: current,
    categoryId: null,
    movementType: null,
    previousRange: null,
    relatedCategories: [],
  };

  // R8: hay gastos y ningún ingreso en el mes actual. Reemplaza a R1 en ese caso.
  if (summary.incomeCents === 0 && summary.expenseCents > 0) {
    result.push({
      ...base,
      id: 'no-income',
      rule: 'R8',
      severity: 'warning',
      title: 'Sin ingresos registrados',
      description:
        'No has registrado ingresos este mes, pero sí gastos. Revisa los movimientos del período.',
      source: `Gastos registrados: ${formatMoney(
        summary.expenseCents,
      )} - Mes actual`,
    });
  }

  // R1: hay ingresos y los gastos del mes actual los igualan o superan.
  if (summary.incomeCents > 0 && summary.expenseCents >= summary.incomeCents) {
    result.push({
      ...base,
      id: 'negative-balance',
      rule: 'R1',
      severity: 'critical',
      title: 'Regla de Balance Negativo',
      description:
        summary.expenseCents > summary.incomeCents
          ? '¡Cuidado! Tus gastos totales superan tus ingresos en el período actual.'
          : '¡Cuidado! Tus gastos totales igualan tus ingresos en el período actual.',
      source: `Diferencia: ${formatMoney(summary.balanceCents)} - Mes actual`,
    });
  }

  // R6: los gastos son al menos el 80 % y menos del 100 % de los ingresos del mes actual.
  const earlyAlert =
    summary.incomeCents > 0 &&
    summary.expenseCents * 100 >= summary.incomeCents * EARLY_ALERT_SHARE &&
    summary.expenseCents < summary.incomeCents;
  if (earlyAlert) {
    result.push({
      ...base,
      id: 'early-spending-alert',
      rule: 'R6',
      severity: 'warning',
      title: 'Alerta temprana de gasto',
      description: `Tus gastos ya consumen el ${percent(
        summary.expenseCents,
        summary.incomeCents,
        'down',
      )}% de tus ingresos de este mes. Revisa tus próximos gastos para no quedar en balance negativo.`,
      source: `Gastos: ${formatMoney(summary.expenseCents)} de ${formatMoney(
        summary.incomeCents,
      )} de ingresos - Mes actual`,
      movementType: 'expense',
    });
  }

  // Consejo de Ahorro: hay ingresos, el balance es positivo y no aplica R6. R1 y R8 lo excluyen
  // porque exigen un balance cero o negativo.
  if (summary.incomeCents > 0 && summary.balanceCents > 0 && !earlyAlert) {
    result.push({
      ...base,
      id: 'savings-tip',
      rule: 'SAVINGS',
      severity: 'info',
      title: 'Consejo de Ahorro',
      description:
        'Mantienes un balance positivo este mes. Considera aumentar tu meta de ahorro mensual.',
      source: `Balance actual: +${formatMoney(
        summary.balanceCents,
      )} - Mes actual`,
    });
  }

  // R2: una sola categoría representa más del 50 % de los gastos del período (mes actual).
  const critical = shares.find(
    share => share.totalCents / summary.expenseCents > CRITICAL_SHARE,
  );
  if (critical !== undefined) {
    result.push({
      ...base,
      id: `critical-category-${critical.categoryId}`,
      rule: 'R2',
      severity: 'critical',
      title: 'Categoría Crítica',
      description: `${critical.name} representa el ${critical.percent}% de tus gastos de este mes.`,
      source: `Monto evaluado: ${formatMoney(
        critical.totalCents,
      )} - Mes actual`,
      categoryId: critical.categoryId,
      movementType: 'expense',
    });
  }

  // R3: los gastos de una categoría en el mes actual superan en más de 30 % los del mes
  // anterior. Sin gastos de esa categoría en el mes anterior no hay base de comparación.
  const lastShares = new Map(
    categoryShares(lastMonth).map(share => [share.categoryId, share]),
  );
  for (const share of shares) {
    const previousShare = lastShares.get(share.categoryId);
    if (
      previousShare !== undefined &&
      share.totalCents > previousShare.totalCents * UNUSUAL_INCREASE
    ) {
      const increase = Math.round(
        (share.totalCents / previousShare.totalCents - 1) * 100,
      );
      result.push({
        ...base,
        id: `unusual-increase-${share.categoryId}`,
        rule: 'R3',
        severity: 'critical',
        title: '¡Alerta de Gastos Altos!',
        description: `Tus gastos en ${share.name} subieron un ${increase}% este mes en comparación con el anterior.`,
        source: `Monto evaluado: ${formatMoney(share.totalCents)} - Mes actual`,
        categoryId: share.categoryId,
        movementType: 'expense',
      });
    }
  }

  const comparisons = compareCategories(comparableNow, comparableBefore);

  // R4: el gasto de una categoría bajó más del 30 % frente a los mismos días del mes anterior.
  // Se destaca la mayor reducción; las demás se consultan desde la tarjeta.
  const reduced = comparisons
    .filter(
      item =>
        (item.previousCents - item.currentCents) * 100 >
        item.previousCents * SPENDING_REDUCTION,
    )
    .map(item => ({
      ...item,
      ratio: (item.previousCents - item.currentCents) / item.previousCents,
      label: percent(
        item.previousCents - item.currentCents,
        item.previousCents,
        'up',
      ),
    }))
    .sort((a, b) => b.ratio - a.ratio || b.previousCents - a.previousCents);
  if (reduced.length > 0) {
    const [top, ...others] = reduced;
    result.push({
      ...base,
      id: 'spending-reduced',
      rule: 'R4',
      severity: 'info',
      title: 'Gasto reducido',
      description: `¡Buen trabajo! Tus gastos en ${top.name} bajaron un ${top.label}% frente a los mismos días del mes anterior.`,
      source: `Monto evaluado: ${formatMoney(
        top.currentCents,
      )} (antes ${formatMoney(top.previousCents)}) - ${period}`,
      range: comparable.current,
      categoryId: top.categoryId,
      movementType: 'expense',
      relatedCategories: others.map(other => ({
        categoryId: other.categoryId,
        name: other.name,
        detail: `bajó ${other.label}%`,
      })),
    });
  }

  // R5: el gasto de una categoría varió como máximo un 10 % frente a los mismos días del mes
  // anterior, con gasto en los dos períodos. Se destaca la menor variación.
  const stable = comparisons
    .filter(
      item =>
        item.currentCents > 0 &&
        Math.abs(item.currentCents - item.previousCents) * 100 <=
          item.previousCents * STABLE_VARIATION,
    )
    .map(item => ({
      ...item,
      ratio:
        Math.abs(item.currentCents - item.previousCents) / item.previousCents,
      label: percent(
        Math.abs(item.currentCents - item.previousCents),
        item.previousCents,
        'down',
      ),
    }))
    .sort((a, b) => a.ratio - b.ratio || b.currentCents - a.currentCents);
  if (stable.length > 0) {
    const [top, ...others] = stable;
    result.push({
      ...base,
      id: 'stable-habit',
      rule: 'R5',
      severity: 'info',
      title: 'Hábito estable',
      description: `Tus gastos en ${top.name} se mantienen constantes: variaron un ${top.label}% frente a los mismos días del mes anterior.`,
      source: `Monto evaluado: ${formatMoney(
        top.currentCents,
      )} (antes ${formatMoney(top.previousCents)}) - ${period}`,
      range: comparable.current,
      categoryId: top.categoryId,
      movementType: 'expense',
      relatedCategories: others.map(other => ({
        categoryId: other.categoryId,
        name: other.name,
        detail: `varió ${other.label}%`,
      })),
    });
  }

  // R7: los ingresos bajaron más del 20 % frente a los mismos días del mes anterior.
  const incomeNow = summarize(comparableNow).incomeCents;
  const incomeBefore = summarize(comparableBefore).incomeCents;
  if (
    incomeBefore > 0 &&
    (incomeBefore - incomeNow) * 100 > incomeBefore * INCOME_DROP
  ) {
    result.push({
      ...base,
      id: 'lower-income',
      rule: 'R7',
      severity: 'warning',
      title: 'Ingresos menores que el mes anterior',
      description: `Tus ingresos bajaron un ${percent(
        incomeBefore - incomeNow,
        incomeBefore,
        'up',
      )}% frente a los mismos días del mes anterior.`,
      source: `Ingresos: ${formatMoney(incomeNow)} (antes ${formatMoney(
        incomeBefore,
      )}) - ${period}`,
      range: comparable.current,
      movementType: 'income',
      previousRange: comparable.previous,
    });
  }
  return result;
}

// Mes de una fecha ISO («2026-11»): período durante el que vale un descarte (I-27).
export function monthOf(today: string): string {
  return today.slice(0, 7);
}

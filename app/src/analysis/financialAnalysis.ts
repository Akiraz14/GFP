import type { MovementListItem } from '../infrastructure/database/repositories/movementRepository';

// Cálculo de Métricas (C4, HU9), tomado de daniela888-li/GFP (8bfa533). Funciones puras sobre
// los movimientos leídos de la base: se recalculan cada vez que se abre la pantalla o cambia el
// período (HU9, reactividad).

export type AnalysisPeriod = 'month' | 'quarter' | 'year';

export type DateRange = { from: string; to: string };

export type AnalysisSummary = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

export type CategoryShare = {
  categoryId: string;
  name: string;
  totalCents: number;
  percent: number;
};

export type EvolutionPoint = {
  label: string;
  incomeCents: number;
  expenseCents: number;
};

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function iso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function monthRange(today: string, offset = 0): DateRange {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) + offset;
  return { from: iso(year, month, 1), to: iso(year, month + 1, 0) };
}

// Períodos equivalentes de las reglas comparativas de HU10: del día 1 a hoy en el mes actual y
// del día 1 al mismo día en el mes anterior, o a su último día si ese mes es más corto (febrero,
// años bisiestos, meses de 30 días).
export function comparablePeriods(today: string): {
  current: DateRange;
  previous: DateRange;
} {
  const previousMonth = monthRange(today, -1);
  const day = Math.min(
    Number(today.slice(8, 10)),
    Number(previousMonth.to.slice(8, 10)),
  );
  return {
    current: { from: monthRange(today).from, to: today },
    previous: {
      from: previousMonth.from,
      to: `${previousMonth.to.slice(0, 8)}${pad(day)}`,
    },
  };
}

export function periodRange(period: AnalysisPeriod, today: string): DateRange {
  const year = Number(today.slice(0, 4));
  switch (period) {
    case 'quarter':
      return { from: monthRange(today, -2).from, to: today };
    case 'year':
      return { from: `${year}-01-01`, to: today };
    default:
      return { from: monthRange(today).from, to: today };
  }
}

export function summarize(
  movements: readonly MovementListItem[],
): AnalysisSummary {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const movement of movements) {
    if (movement.type === 'income') {
      incomeCents += movement.amountCents;
    } else {
      expenseCents += movement.amountCents;
    }
  }
  return {
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
  };
}

// Porcentaje de cada categoría sobre el total de gastos, de mayor a menor. Usa el tipo del
// movimiento, no el de la categoría (E06-D3).
export function categoryShares(
  movements: readonly MovementListItem[],
): CategoryShare[] {
  const totals = new Map<string, { name: string; totalCents: number }>();
  let expenseCents = 0;
  for (const movement of movements) {
    if (movement.type !== 'expense') {
      continue;
    }
    expenseCents += movement.amountCents;
    const entry = totals.get(movement.categoryId);
    totals.set(movement.categoryId, {
      name: movement.categoryName,
      totalCents: (entry?.totalCents ?? 0) + movement.amountCents,
    });
  }
  return [...totals.entries()]
    .map(([categoryId, { name, totalCents }]) => ({
      categoryId,
      name,
      totalCents,
      percent: Math.round((totalCents / expenseCents) * 100),
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

// Hasta 62 días se agrupa por semana desde el inicio del rango; más, por mes (E11-D3).
export function evolution(
  movements: readonly MovementListItem[],
  range: DateRange,
): EvolutionPoint[] {
  const byWeek = daysBetween(range.from, range.to) <= 62;
  const points = new Map<string, EvolutionPoint>();
  const add = (key: string, label: string) => {
    if (!points.has(key)) {
      points.set(key, { label, incomeCents: 0, expenseCents: 0 });
    }
  };
  if (byWeek) {
    const weeks = Math.floor(daysBetween(range.from, range.to) / 7) + 1;
    for (let week = 1; week <= weeks; week += 1) {
      add(pad(week), `Sem ${week}`);
    }
  } else {
    const start = range.from.slice(0, 7);
    const end = range.to.slice(0, 7);
    let year = Number(start.slice(0, 4));
    let month = Number(start.slice(5, 7));
    while (`${year}-${pad(month)}` <= end) {
      add(`${year}-${pad(month)}`, `${MONTH_LABELS[month - 1]} ${year % 100}`);
      month = month === 12 ? 1 : month + 1;
      year = month === 1 ? year + 1 : year;
    }
  }
  for (const movement of movements) {
    const key = byWeek
      ? pad(Math.floor(daysBetween(range.from, movement.occurredOn) / 7) + 1)
      : movement.occurredOn.slice(0, 7);
    const point = points.get(key);
    if (point === undefined) {
      continue;
    }
    if (movement.type === 'income') {
      point.incomeCents += movement.amountCents;
    } else {
      point.expenseCents += movement.amountCents;
    }
  }
  return [...points.values()];
}

// Tomado de daniela888-li/GFP (8bfa533).
import {
  categoryShares,
  comparablePeriods,
  evolution,
  monthRange,
  periodRange,
  summarize,
} from '../../src/analysis/financialAnalysis';
import { item } from '../../testing/movementFixtures';

describe('HU9 periods', () => {
  test('computes the month, quarter and year ranges', () => {
    expect(monthRange('2026-03-15', -1)).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    expect(monthRange('2026-01-15', -1).from).toBe('2025-12-01');
    expect(periodRange('month', '2026-11-04')).toEqual({
      from: '2026-11-01',
      to: '2026-11-04',
    });
    expect(periodRange('quarter', '2026-11-04').from).toBe('2026-09-01');
    expect(periodRange('year', '2026-11-04').from).toBe('2026-01-01');
  });
});

describe('HU9 metrics', () => {
  test('Balance = Total Ingresos - Total Gastos', () => {
    expect(
      summarize([
        item('2026-11-01', 'income', 1000),
        item('2026-11-02', 'expense', 1500),
      ]),
    ).toEqual({ incomeCents: 1000, expenseCents: 1500, balanceCents: -500 });
  });

  test('distributes only the expenses, from highest to lowest', () => {
    const shares = categoryShares([
      item('2026-11-01', 'income', 9999, 'other', 'Otros'),
      item('2026-11-01', 'expense', 7500, 'housing', 'Vivienda'),
      item('2026-11-01', 'expense', 2500),
    ]);
    expect(shares.map(share => [share.name, share.percent])).toEqual([
      ['Vivienda', 75],
      ['Alimentación', 25],
    ]);
  });

  test('groups by week in short ranges and by month in long ones', () => {
    const weeks = evolution(
      [item('2026-11-01', 'expense', 100), item('2026-11-09', 'income', 200)],
      { from: '2026-11-01', to: '2026-11-14' },
    );
    expect(weeks).toEqual([
      { label: 'Sem 1', incomeCents: 0, expenseCents: 100 },
      { label: 'Sem 2', incomeCents: 200, expenseCents: 0 },
    ]);
    const months = evolution([item('2026-02-10', 'income', 300)], {
      from: '2025-12-01',
      to: '2026-03-31',
    });
    expect(months.map(point => point.label)).toEqual([
      'Dic 25',
      'Ene 26',
      'Feb 26',
      'Mar 26',
    ]);
    expect(months[2].incomeCents).toBe(300);
  });
});

describe('HU10 equivalent periods', () => {
  test('the same days of the previous month, capped at its last day', () => {
    expect(comparablePeriods('2026-11-10')).toEqual({
      current: { from: '2026-11-01', to: '2026-11-10' },
      previous: { from: '2026-10-01', to: '2026-10-10' },
    });
    expect(comparablePeriods('2026-05-31').previous).toEqual({
      from: '2026-04-01',
      to: '2026-04-30',
    });
    expect(comparablePeriods('2026-03-30').previous.to).toBe('2026-02-28');
    expect(comparablePeriods('2028-03-30').previous.to).toBe('2028-02-29');
    expect(comparablePeriods('2028-02-29')).toEqual({
      current: { from: '2028-02-01', to: '2028-02-29' },
      previous: { from: '2028-01-01', to: '2028-01-29' },
    });
    expect(comparablePeriods('2026-01-01').previous).toEqual({
      from: '2025-12-01',
      to: '2025-12-01',
    });
  });
});

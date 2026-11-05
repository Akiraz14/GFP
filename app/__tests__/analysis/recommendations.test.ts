// Adaptado de daniela888-li/GFP (4c7cd2f): sin la regla «Consejo de Ahorro» (solo R1, R2 y R3).
import {
  evaluateRecommendations,
  monthOf,
} from '../../src/analysis/recommendations';
import { item } from '../../testing/movementFixtures';

const TODAY = '2026-11-04';

function ids(movements: Parameters<typeof evaluateRecommendations>[0]) {
  return evaluateRecommendations(movements, TODAY).map(({ id }) => id);
}

describe('HU10 rules', () => {
  test('no movements activate no rule', () => {
    expect(ids([])).toEqual([]);
  });

  test('R1: expenses above incomes in the current month', () => {
    const result = evaluateRecommendations(
      [
        item('2026-11-01', 'income', 10000),
        item('2026-11-02', 'expense', 15000),
      ],
      TODAY,
    );
    expect(result[0]).toMatchObject({
      id: 'negative-balance',
      rule: 'R1',
      severity: 'warning',
      source: 'Diferencia: -$50,00 - Mes actual',
      range: { from: '2026-11-01', to: '2026-11-30' },
      categoryId: null,
    });
  });

  test('R1 ignores the previous month and equal totals', () => {
    expect(ids([item('2026-10-02', 'expense', 15000)])).toEqual([]);
    expect(
      ids([
        item('2026-11-01', 'income', 1000),
        item('2026-11-02', 'expense', 500),
        item('2026-11-02', 'expense', 500, 'transport', 'Transporte'),
      ]),
    ).toEqual([]);
  });

  test('R2: more than 50 % and not exactly 50 %', () => {
    expect(
      ids([
        item('2026-11-01', 'income', 100000),
        item('2026-11-02', 'expense', 500),
        item('2026-11-02', 'expense', 500, 'transport', 'Transporte'),
      ]),
    ).toEqual([]);
    expect(
      ids([
        item('2026-11-01', 'income', 100000),
        item('2026-11-02', 'expense', 501),
        item('2026-11-02', 'expense', 499, 'transport', 'Transporte'),
      ]),
    ).toEqual(['critical-category-food']);
  });

  test('R3: more than 30 % over the previous month', () => {
    const base = [
      item('2026-11-01', 'income', 100000),
      item('2026-10-02', 'expense', 1000),
      item('2026-11-02', 'expense', 1000, 'transport', 'Transporte'),
    ];
    expect(ids([...base, item('2026-11-02', 'expense', 1300)])).not.toContain(
      'unusual-increase-food',
    );
    const result = evaluateRecommendations(
      [...base, item('2026-11-02', 'expense', 1350)],
      TODAY,
    );
    expect(
      result.find(({ id }) => id === 'unusual-increase-food'),
    ).toMatchObject({
      rule: 'R3',
      severity: 'critical',
      description:
        'Tus gastos en Alimentación subieron un 35% este mes en comparación con el anterior.',
      categoryId: 'food',
    });
  });

  test('R3 needs expenses of the category in the previous month', () => {
    expect(
      ids([
        item('2026-11-01', 'income', 100000),
        item('2026-11-02', 'expense', 100),
        item('2026-11-02', 'expense', 100, 'transport', 'Transporte'),
      ]),
    ).toEqual([]);
  });

  test('only R1, R2 and R3 exist: a positive balance gives no card', () => {
    expect(
      ids([
        item('2026-11-01', 'income', 100000),
        item('2026-11-02', 'expense', 100),
        item('2026-11-02', 'expense', 100, 'transport', 'Transporte'),
        item('2026-11-02', 'expense', 100, 'housing', 'Vivienda'),
      ]),
    ).toEqual([]);
  });

  test('the dismissal period is the month of the date', () => {
    expect(monthOf('2026-11-04')).toBe('2026-11');
  });
});

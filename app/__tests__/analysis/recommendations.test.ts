// Adaptado de daniela888-li/GFP (4c7cd2f). El «Consejo de Ahorro» se evalúa desde AJ-04 (E-AJ-D1).
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
      severity: 'critical',
      source: 'Diferencia: -$50,00 - Mes actual',
      range: { from: '2026-11-01', to: '2026-11-30' },
      categoryId: null,
      movementType: null,
    });
  });

  test('R1 ignores the previous month and applies to equal totals', () => {
    expect(ids([item('2026-10-02', 'expense', 15000)])).toEqual([]);
    const [equal] = evaluateRecommendations(
      [
        item('2026-11-01', 'income', 1000),
        item('2026-11-02', 'expense', 500),
        item('2026-11-02', 'expense', 500, 'transport', 'Transporte'),
      ],
      TODAY,
    );
    expect(equal).toMatchObject({
      id: 'negative-balance',
      description:
        '¡Cuidado! Tus gastos totales igualan tus ingresos en el período actual.',
      source: 'Diferencia: $0,00 - Mes actual',
    });
  });

  test('R2: more than 50 % and not exactly 50 %', () => {
    expect(
      ids([
        item('2026-11-01', 'income', 100000),
        item('2026-11-02', 'expense', 500),
        item('2026-11-02', 'expense', 500, 'transport', 'Transporte'),
      ]),
    ).toEqual(['savings-tip']);
    expect(
      ids([
        item('2026-11-01', 'income', 100000),
        item('2026-11-02', 'expense', 501),
        item('2026-11-02', 'expense', 499, 'transport', 'Transporte'),
      ]),
    ).toEqual(['savings-tip', 'critical-category-food']);
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
    ).not.toContain('unusual-increase-food');
  });

  test('AJ-04: a positive balance of the current month gives the savings tip', () => {
    const [tip] = evaluateRecommendations(
      [
        item('2026-11-01', 'income', 100000),
        item('2026-11-02', 'expense', 100),
        item('2026-11-02', 'expense', 100, 'transport', 'Transporte'),
        item('2026-11-02', 'expense', 100, 'housing', 'Vivienda'),
      ],
      TODAY,
    );
    expect(tip).toMatchObject({
      id: 'savings-tip',
      rule: 'SAVINGS',
      severity: 'info',
      title: 'Consejo de Ahorro',
      description:
        'Mantienes un balance positivo este mes. Considera aumentar tu meta de ahorro mensual.',
      categoryId: null,
    });
    expect(tip.source).toMatch(
      /^Balance actual: \+\$[\d.]+,\d{2} - Mes actual$/,
    );
  });

  test('AJ-04: no savings tip without incomes, with equal totals or with a negative balance', () => {
    expect(ids([])).toEqual([]);
    expect(ids([item('2026-11-02', 'expense', 100)])).not.toContain(
      'savings-tip',
    );
    expect(
      ids([
        item('2026-11-01', 'income', 100),
        item('2026-11-02', 'expense', 50),
        item('2026-11-02', 'expense', 50, 'transport', 'Transporte'),
      ]),
    ).toEqual(['negative-balance']);
    expect(
      ids([
        item('2026-11-01', 'income', 100),
        item('2026-11-02', 'expense', 101),
      ]),
    ).not.toContain('savings-tip');
    expect(
      ids([
        item('2026-10-01', 'income', 100000),
        item('2026-11-02', 'expense', 100),
      ]),
    ).not.toContain('savings-tip');
  });

  test('the dismissal period is the month of the date', () => {
    expect(monthOf('2026-11-04')).toBe('2026-11');
  });
});

// Mejora del módulo de recomendaciones: reglas R4 a R8, prioridades y períodos equivalentes.
describe('extended recommendation rules', () => {
  const INCOME = item('2026-11-01', 'income', 1_000_000, 'salary', 'Salario');

  function find(
    movements: Parameters<typeof evaluateRecommendations>[0],
    id: string,
    today = TODAY,
  ) {
    return evaluateRecommendations(movements, today).find(
      recommendation => recommendation.id === id,
    );
  }

  function categoryChange(
    previousCents: number,
    currentCents: number,
    categoryId = 'food',
    name = 'Alimentación',
  ) {
    return [
      item('2026-10-02', 'expense', previousCents, categoryId, name),
      item('2026-11-02', 'expense', currentCents, categoryId, name),
    ];
  }

  describe('R4: reduced spending', () => {
    test('29 % and 30 % do not activate it; more than 30 % does', () => {
      expect(
        find([INCOME, ...categoryChange(10000, 7100)], 'spending-reduced'),
      ).toBeUndefined();
      expect(
        find([INCOME, ...categoryChange(10000, 7000)], 'spending-reduced'),
      ).toBeUndefined();
      expect(
        find([INCOME, ...categoryChange(10000, 6999)], 'spending-reduced'),
      ).toMatchObject({
        rule: 'R4',
        severity: 'info',
        title: 'Gasto reducido',
        description:
          '¡Buen trabajo! Tus gastos en Alimentación bajaron un 30,1% frente a los mismos días del mes anterior.',
        source:
          'Monto evaluado: $69,99 (antes $100,00) - Días 1 al 4 de cada mes',
        range: { from: '2026-11-01', to: '2026-11-04' },
        categoryId: 'food',
        movementType: 'expense',
        relatedCategories: [],
      });
    });

    test('a category with no spending in the comparable period does not activate it', () => {
      expect(
        find([INCOME, item('2026-11-02', 'expense', 100)], 'spending-reduced'),
      ).toBeUndefined();
    });

    test('several categories: the largest reduction stands out and the others are listed', () => {
      const result = find(
        [
          INCOME,
          ...categoryChange(10000, 6000),
          ...categoryChange(10000, 2000, 'transport', 'Transporte'),
          ...categoryChange(10000, 5000, 'housing', 'Vivienda'),
          ...categoryChange(10000, 9000, 'health', 'Salud'),
        ],
        'spending-reduced',
      );
      expect(result).toMatchObject({
        categoryId: 'transport',
        relatedCategories: [
          { categoryId: 'housing', name: 'Vivienda', detail: 'bajó 50%' },
          { categoryId: 'food', name: 'Alimentación', detail: 'bajó 40%' },
        ],
      });
      expect(
        evaluateRecommendations(
          [
            INCOME,
            ...categoryChange(10000, 6000),
            ...categoryChange(10000, 2000, 'transport', 'Transporte'),
          ],
          TODAY,
        ).filter(({ rule }) => rule === 'R4'),
      ).toHaveLength(1);
    });
  });

  describe('R5: stable habit', () => {
    test('9 % and 10 % activate it; more than 10 % does not', () => {
      expect(
        find([INCOME, ...categoryChange(10000, 10900)], 'stable-habit'),
      ).toMatchObject({
        rule: 'R5',
        severity: 'info',
        title: 'Hábito estable',
        description:
          'Tus gastos en Alimentación se mantienen constantes: variaron un 9% frente a los mismos días del mes anterior.',
        categoryId: 'food',
        movementType: 'expense',
      });
      expect(
        find([INCOME, ...categoryChange(10000, 9000)], 'stable-habit'),
      ).toBeDefined();
      expect(
        find([INCOME, ...categoryChange(10000, 11000)], 'stable-habit'),
      ).toBeDefined();
      expect(
        find([INCOME, ...categoryChange(10000, 11001)], 'stable-habit'),
      ).toBeUndefined();
      expect(
        find([INCOME, ...categoryChange(10000, 8999)], 'stable-habit'),
      ).toBeUndefined();
    });

    test('it needs spending in both periods', () => {
      expect(
        find([INCOME, item('2026-11-02', 'expense', 100)], 'stable-habit'),
      ).toBeUndefined();
      expect(
        find([INCOME, item('2026-10-02', 'expense', 100)], 'stable-habit'),
      ).toBeUndefined();
    });

    test('several categories: the smallest variation stands out', () => {
      expect(
        find(
          [
            INCOME,
            ...categoryChange(10000, 10800),
            ...categoryChange(10000, 10100, 'transport', 'Transporte'),
            ...categoryChange(10000, 9500, 'housing', 'Vivienda'),
          ],
          'stable-habit',
        ),
      ).toMatchObject({
        categoryId: 'transport',
        relatedCategories: [
          { categoryId: 'housing', detail: 'varió 5%' },
          { categoryId: 'food', detail: 'varió 8%' },
        ],
      });
    });
  });

  describe('R6: early spending alert', () => {
    const month = (expenseCents: number, incomeCents = 10000) => [
      item('2026-11-01', 'income', incomeCents, 'salary', 'Salario'),
      item('2026-11-02', 'expense', expenseCents),
    ];

    test('79 % does not activate it; 80 % and 99 % do', () => {
      expect(find(month(7900), 'early-spending-alert')).toBeUndefined();
      expect(find(month(8000), 'early-spending-alert')).toMatchObject({
        rule: 'R6',
        severity: 'warning',
        title: 'Alerta temprana de gasto',
        description:
          'Tus gastos ya consumen el 80% de tus ingresos de este mes. Revisa tus próximos gastos para no quedar en balance negativo.',
        source: 'Gastos: $80,00 de $100,00 de ingresos - Mes actual',
        movementType: 'expense',
        categoryId: null,
      });
      expect(find(month(9900), 'early-spending-alert')).toBeDefined();
      expect(find(month(9999), 'early-spending-alert')?.description).toMatch(
        /consumen el 99,9%/,
      );
    });

    test('100 % gives the negative balance instead', () => {
      const result = ids(month(10000));
      expect(result).toContain('negative-balance');
      expect(result).not.toContain('early-spending-alert');
    });

    test('no incomes: it does not apply', () => {
      expect(
        find([item('2026-11-02', 'expense', 100)], 'early-spending-alert'),
      ).toBeUndefined();
    });
  });

  describe('R7: lower income than the previous month', () => {
    const incomes = (previousCents: number, currentCents: number) => [
      item('2026-10-01', 'income', previousCents, 'salary', 'Salario'),
      item('2026-11-01', 'income', currentCents, 'salary', 'Salario'),
    ];

    test('19 % and 20 % do not activate it; more than 20 % does', () => {
      expect(find(incomes(10000, 8100), 'lower-income')).toBeUndefined();
      expect(find(incomes(10000, 8000), 'lower-income')).toBeUndefined();
      expect(find(incomes(10000, 7900), 'lower-income')).toMatchObject({
        rule: 'R7',
        severity: 'warning',
        title: 'Ingresos menores que el mes anterior',
        description:
          'Tus ingresos bajaron un 21% frente a los mismos días del mes anterior.',
        source: 'Ingresos: $79,00 (antes $100,00) - Días 1 al 4 de cada mes',
        range: { from: '2026-11-01', to: '2026-11-04' },
        previousRange: { from: '2026-10-01', to: '2026-10-04' },
        movementType: 'income',
        categoryId: null,
      });
    });

    test('no incomes in the comparable previous period: it does not apply', () => {
      expect(
        find(
          [item('2026-11-01', 'income', 100, 'salary', 'Salario')],
          'lower-income',
        ),
      ).toBeUndefined();
    });
  });

  describe('R8: no incomes registered', () => {
    test('expenses without incomes activate it instead of the negative balance', () => {
      const result = evaluateRecommendations(
        [item('2026-11-02', 'expense', 5000)],
        TODAY,
      );
      expect(result[0]).toMatchObject({
        id: 'no-income',
        rule: 'R8',
        severity: 'warning',
        title: 'Sin ingresos registrados',
        source: 'Gastos registrados: $50,00 - Mes actual',
        range: { from: '2026-11-01', to: '2026-11-30' },
        categoryId: null,
        movementType: null,
      });
      expect(result.map(({ id }) => id)).not.toContain('negative-balance');
    });

    test('it needs expenses and no incomes in the current month', () => {
      expect(ids([])).not.toContain('no-income');
      expect(
        ids([item('2026-11-01', 'income', 100, 'salary', 'Salario')]),
      ).not.toContain('no-income');
      expect(
        ids([
          item('2026-11-01', 'income', 100, 'salary', 'Salario'),
          item('2026-11-02', 'expense', 500),
        ]),
      ).not.toContain('no-income');
    });
  });

  describe('priority and coexistence', () => {
    test('the negative balance excludes the early alert and the savings tip', () => {
      const result = ids([INCOME, item('2026-11-02', 'expense', 1_200_000)]);
      expect(result).toContain('negative-balance');
      expect(result).not.toContain('early-spending-alert');
      expect(result).not.toContain('savings-tip');
    });

    test('no incomes excludes the negative balance', () => {
      expect(ids([item('2026-11-02', 'expense', 100)])).toEqual([
        'no-income',
        'critical-category-food',
      ]);
    });

    test('the early alert excludes the savings tip; below 80 % the tip shows', () => {
      const alert = ids([INCOME, item('2026-11-02', 'expense', 850_000)]);
      expect(alert).toContain('early-spending-alert');
      expect(alert).not.toContain('savings-tip');
      const tip = ids([INCOME, item('2026-11-02', 'expense', 799_999)]);
      expect(tip).toContain('savings-tip');
      expect(tip).not.toContain('early-spending-alert');
    });

    test('reduced spending and a stable habit can show together', () => {
      const result = ids([
        INCOME,
        ...categoryChange(10000, 5000),
        ...categoryChange(10000, 10000, 'transport', 'Transporte'),
      ]);
      expect(result).toEqual(
        expect.arrayContaining(['spending-reduced', 'stable-habit']),
      );
    });

    test('lower income and the negative balance can show together', () => {
      const result = ids([
        item('2026-10-01', 'income', 10000, 'salary', 'Salario'),
        item('2026-11-01', 'income', 5000, 'salary', 'Salario'),
        item('2026-11-02', 'expense', 6000),
      ]);
      expect(result).toEqual(
        expect.arrayContaining(['negative-balance', 'lower-income']),
      );
    });

    test('the critical category keeps showing with the other rules', () => {
      const result = ids([
        item('2026-11-02', 'expense', 900),
        item('2026-11-02', 'expense', 100, 'transport', 'Transporte'),
      ]);
      expect(result).toEqual(['no-income', 'critical-category-food']);
    });
  });

  describe('equivalent periods', () => {
    test('days after today in the previous month are not compared', () => {
      const movements = [
        INCOME,
        item('2026-10-03', 'expense', 10000),
        item('2026-10-20', 'expense', 90000),
        item('2026-11-02', 'expense', 10000),
      ];
      expect(find(movements, 'stable-habit')).toMatchObject({
        description: expect.stringContaining('variaron un 0%'),
        source:
          'Monto evaluado: $100,00 (antes $100,00) - Días 1 al 4 de cada mes',
      });
      expect(find(movements, 'spending-reduced')).toBeUndefined();
    });

    test('a 31st compares against the last day of a 30-day month', () => {
      const result = find(
        [
          item('2026-12-01', 'income', 1_000_000, 'salary', 'Salario'),
          item('2026-11-30', 'expense', 10000),
          item('2026-12-31', 'expense', 10000),
        ],
        'stable-habit',
        '2026-12-31',
      );
      expect(result?.source).toBe(
        'Monto evaluado: $100,00 (antes $100,00) - Días 1 al 31 (mes anterior: 1 al 30)',
      );
    });

    test('February: 28 days in a common year and 29 in a leap year', () => {
      const movements = (year: number) => [
        item(`${year}-02-01`, 'income', 10000, 'salary', 'Salario'),
        item(`${year}-02-29`, 'income', 10000, 'salary', 'Salario'),
        item(`${year}-03-01`, 'income', 10000, 'salary', 'Salario'),
      ];
      expect(
        find(movements(2026), 'lower-income', '2026-03-31'),
      ).toBeUndefined();
      expect(find(movements(2028), 'lower-income', '2028-03-31')).toMatchObject(
        {
          previousRange: { from: '2028-02-01', to: '2028-02-29' },
          source:
            'Ingresos: $100,00 (antes $200,00) - Días 1 al 31 (mes anterior: 1 al 29)',
        },
      );
    });

    test('January compares against December of the previous year', () => {
      expect(
        find(
          [
            item('2025-12-05', 'income', 10000, 'salary', 'Salario'),
            item('2026-01-05', 'income', 5000, 'salary', 'Salario'),
          ],
          'lower-income',
          '2026-01-10',
        )?.previousRange,
      ).toEqual({ from: '2025-12-01', to: '2025-12-10' });
    });

    test('without movements in the previous month no comparative rule applies', () => {
      const result = ids([INCOME, item('2026-11-02', 'expense', 1000)]);
      expect(result).not.toContain('spending-reduced');
      expect(result).not.toContain('stable-habit');
      expect(result).not.toContain('lower-income');
      expect(result).not.toContain('unusual-increase-food');
    });
  });
});

describe('R4 with no spending yet in the current period', () => {
  test('a category without spending this period counts as reduced only if the period has expenses', () => {
    const previous = [
      item('2026-10-02', 'expense', 10000),
      item('2026-10-02', 'expense', 10000, 'transport', 'Transporte'),
    ];
    expect(ids(previous)).toEqual([]);
    const result = evaluateRecommendations(
      [
        ...previous,
        item('2026-11-02', 'expense', 10000, 'transport', 'Transporte'),
      ],
      TODAY,
    ).find(({ id }) => id === 'spending-reduced');
    expect(result).toMatchObject({ categoryId: 'food' });
    expect(result?.description).toMatch(/bajaron un 100%/);
  });
});

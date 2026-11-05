import {
  categoriesForType,
  isCategoryAllowed,
  normalizeDescription,
  toValidMovementInput,
  validateMovementInput,
  type MovementInput,
} from '../../src/business/movements/movementRules';

const TODAY = '2026-10-24';

function input(overrides: Partial<MovementInput> = {}): MovementInput {
  return {
    type: 'expense',
    amount: '45.500',
    date: '24/10/2026',
    categoryId: 'food',
    description: '',
    ...overrides,
  };
}

const CATEGORIES = [
  { id: 'food', type: 'expense' as const },
  { id: 'salary', type: 'income' as const },
  { id: 'other', type: 'expense' as const },
  { id: 'own-bonus', type: 'income' as const },
];

describe('HU4 validation', () => {
  test('a complete input is valid and converted to stored values', () => {
    expect(validateMovementInput(input(), TODAY)).toEqual({});
    expect(
      toValidMovementInput(input({ description: '  Almuerzo  ' }), TODAY),
    ).toEqual({
      type: 'expense',
      amountCents: 4_550_000,
      occurredOn: TODAY,
      categoryId: 'food',
      description: 'Almuerzo',
    });
  });

  test('HU4-CA01: type, category, date and amount are required', () => {
    expect(
      validateMovementInput(
        { type: '', amount: '', date: '', categoryId: '', description: '' },
        TODAY,
      ),
    ).toEqual({
      type: 'required',
      amount: 'invalid',
      date: 'required',
      categoryId: 'required',
    });
    expect(toValidMovementInput(input({ amount: '' }), TODAY)).toBeNull();
  });

  test('rejects an unknown movement type', () => {
    expect(validateMovementInput(input({ type: 'transfer' }), TODAY)).toEqual({
      type: 'required',
    });
  });

  test('HU4-CA04: the date cannot be after today; today and past dates are valid', () => {
    expect(validateMovementInput(input({ date: '25/10/2026' }), TODAY)).toEqual(
      { date: 'future' },
    );
    expect(validateMovementInput(input({ date: '23/10/2026' }), TODAY)).toEqual(
      {},
    );
    expect(validateMovementInput(input({ date: '31/02/2026' }), TODAY)).toEqual(
      { date: 'invalid' },
    );
  });

  test('HU4-CA05: the amount must be a positive number', () => {
    for (const amount of ['0', '-5', 'abc', '1,234']) {
      expect(validateMovementInput(input({ amount }), TODAY)).toEqual({
        amount: 'invalid',
      });
    }
  });

  test('HU4-CA06: the description is optional and up to 250 characters', () => {
    expect(normalizeDescription('   ')).toBeNull();
    expect(normalizeDescription(' a ')).toBe('a');
    expect(
      validateMovementInput(input({ description: 'x'.repeat(250) }), TODAY),
    ).toEqual({});
    expect(
      validateMovementInput(input({ description: 'x'.repeat(251) }), TODAY),
    ).toEqual({ description: 'too_long' });
    // Los espacios externos no cuentan y un emoji cuenta como un carácter.
    expect(
      validateMovementInput(
        input({ description: `  ${'😀'.repeat(250)}  ` }),
        TODAY,
      ),
    ).toEqual({});
  });
});

describe('D-02: categories by movement type', () => {
  test('expense movements see expense categories and «Otros»', () => {
    expect(categoriesForType(CATEGORIES, 'expense').map(c => c.id)).toEqual([
      'food',
      'other',
    ]);
  });

  test('income movements see income categories and «Otros» (E06-D3)', () => {
    expect(categoriesForType(CATEGORIES, 'income').map(c => c.id)).toEqual([
      'salary',
      'other',
      'own-bonus',
    ]);
    expect(isCategoryAllowed({ id: 'other', type: 'expense' }, 'income')).toBe(
      true,
    );
  });

  test('editing keeps the current category even if its type changed', () => {
    expect(isCategoryAllowed({ id: 'food', type: 'expense' }, 'income')).toBe(
      false,
    );
    expect(
      isCategoryAllowed({ id: 'food', type: 'expense' }, 'income', 'food'),
    ).toBe(true);
    expect(
      categoriesForType(CATEGORIES, 'income', 'food').map(c => c.id),
    ).toContain('food');
  });
});

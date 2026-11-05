import {
  EMPTY_FILTER_INPUT,
  hasActiveFilters,
  toMovementFilters,
  validateFilterInput,
} from '../../src/business/movements/movementFilters';
import { NO_MOVEMENT_FILTERS } from '../../src/infrastructure/database/repositories/movementRepository';

describe('HU5 filters (E08-D3)', () => {
  test('empty filters do not filter', () => {
    expect(validateFilterInput(EMPTY_FILTER_INPUT)).toEqual({});
    expect(toMovementFilters(EMPTY_FILTER_INPUT)).toEqual(NO_MOVEMENT_FILTERS);
    expect(hasActiveFilters(NO_MOVEMENT_FILTERS)).toBe(false);
  });

  test('converts every filter to stored values', () => {
    const filters = toMovementFilters({
      from: '01/10/2026',
      to: '31/10/2026',
      type: 'expense',
      categoryId: 'food',
    });
    expect(filters).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
      type: 'expense',
      categoryId: 'food',
    });
    expect(hasActiveFilters(filters!)).toBe(true);
  });

  test('either end of the range may be empty, and both may be the same day', () => {
    expect(
      toMovementFilters({ ...EMPTY_FILTER_INPUT, from: '01/10/2026' }),
    ).toMatchObject({ from: '2026-10-01', to: null });
    expect(
      toMovementFilters({ ...EMPTY_FILTER_INPUT, to: '01/10/2026' }),
    ).toMatchObject({ from: null, to: '2026-10-01' });
    expect(
      validateFilterInput({
        ...EMPTY_FILTER_INPUT,
        from: '01/10/2026',
        to: '01/10/2026',
      }),
    ).toEqual({});
  });

  test('rejects dates that do not exist or have another format', () => {
    expect(
      validateFilterInput({
        ...EMPTY_FILTER_INPUT,
        from: '31/02/2026',
        to: '2026-10-01',
      }),
    ).toEqual({ from: 'invalid', to: 'invalid' });
    expect(
      toMovementFilters({ ...EMPTY_FILTER_INPUT, from: 'ayer' }),
    ).toBeNull();
  });

  test('the end date cannot be before the start date', () => {
    expect(
      validateFilterInput({
        ...EMPTY_FILTER_INPUT,
        from: '15/10/2026',
        to: '14/10/2026',
      }),
    ).toEqual({ to: 'before_start' });
  });
});

import type {
  MovementFilters,
  MovementType,
} from '../../infrastructure/database/repositories/movementRepository';
import {
  formatDisplayDate,
  isAfter,
  parseDisplayDate,
} from '../dates/localDate';
import { isMovementType } from './movementRules';

// Filtros del historial tal como los escribe el usuario (HU5). Un campo vacío no filtra.
export type MovementFilterInput = {
  from: string;
  to: string;
  type: '' | MovementType;
  categoryId: string;
};

export type MovementFilterErrors = {
  from?: 'invalid';
  to?: 'invalid' | 'before_start';
};

export const EMPTY_FILTER_INPUT: MovementFilterInput = {
  from: '',
  to: '',
  type: '',
  categoryId: '',
};

// E08-D3: las fechas del rango son opcionales; si se escriben deben ser fechas reales
// `DD/MM/AAAA`, y la fecha fin no puede ser anterior a la fecha inicio.
export function validateFilterInput(
  input: MovementFilterInput,
): MovementFilterErrors {
  const errors: MovementFilterErrors = {};
  const from = input.from.trim() === '' ? null : parseDisplayDate(input.from);
  const to = input.to.trim() === '' ? null : parseDisplayDate(input.to);
  if (input.from.trim() !== '' && from === null) {
    errors.from = 'invalid';
  }
  if (input.to.trim() !== '' && to === null) {
    errors.to = 'invalid';
  } else if (from !== null && to !== null && isAfter(from, to)) {
    errors.to = 'before_start';
  }
  return errors;
}

export function toMovementFilters(
  input: MovementFilterInput,
): MovementFilters | null {
  if (Object.keys(validateFilterInput(input)).length > 0) {
    return null;
  }
  return {
    from: input.from.trim() === '' ? null : parseDisplayDate(input.from),
    to: input.to.trim() === '' ? null : parseDisplayDate(input.to),
    type: isMovementType(input.type) ? input.type : null,
    categoryId: input.categoryId === '' ? null : input.categoryId,
  };
}

export function hasActiveFilters(filters: MovementFilters): boolean {
  return (
    filters.from !== null ||
    filters.to !== null ||
    filters.type !== null ||
    filters.categoryId !== null
  );
}

// Filtros de entrada que corresponden a unos filtros ya aplicados, para abrir el historial
// desde Análisis (HU9) o Recomendaciones (HU10).
export function filterInputFrom(filters: MovementFilters): MovementFilterInput {
  return {
    from: filters.from === null ? '' : formatDisplayDate(filters.from),
    to: filters.to === null ? '' : formatDisplayDate(filters.to),
    type: filters.type ?? '',
    categoryId: filters.categoryId ?? '',
  };
}

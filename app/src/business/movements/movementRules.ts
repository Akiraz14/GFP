import { OTHER_CATEGORY_ID } from '../../infrastructure/database/categoryCatalogs';
import type { Category } from '../../infrastructure/database/repositories/categoryRepository';
import type {
  MovementType,
  MovementValues,
} from '../../infrastructure/database/repositories/movementRepository';
import { isAfter, parseDisplayDate, type IsoDate } from '../dates/localDate';
import { parseAmountInput } from '../money/money';

// Reglas de HU4 (Etapa 07).

export const DESCRIPTION_MAX_LENGTH = 250;

export const MOVEMENT_TYPES: readonly MovementType[] = ['expense', 'income'];

// Lo que escribe el usuario en el formulario: el monto y la fecha como texto.
export type MovementInput = {
  type: string;
  amount: string;
  date: string;
  categoryId: string;
  description: string;
};

export type MovementFieldErrors = {
  type?: 'required';
  amount?: 'invalid';
  date?: 'required' | 'invalid' | 'future';
  categoryId?: 'required' | 'incompatible';
  description?: 'too_long';
};

export function isMovementType(value: string): value is MovementType {
  return (MOVEMENT_TYPES as readonly string[]).includes(value);
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

// La descripción es opcional (HU4-CA06): se recortan los espacios externos y un texto vacío
// se guarda como nulo.
export function normalizeDescription(raw: string): string | null {
  const trimmed = raw.normalize('NFC').trim();
  return trimmed.length === 0 ? null : trimmed;
}

// D-02 con E06-D3: una categoría sirve para un movimiento si es de su mismo tipo; «Otros»
// sirve para ambos tipos. Al editar se acepta además la categoría que ya tenía el
// movimiento, aunque su tipo haya cambiado después (HU8-CA06).
export function isCategoryAllowed(
  category: Pick<Category, 'id' | 'type'>,
  type: MovementType,
  currentCategoryId: string | null = null,
): boolean {
  return (
    category.type === type ||
    category.id === OTHER_CATEGORY_ID ||
    category.id === currentCategoryId
  );
}

export function categoriesForType<T extends Pick<Category, 'id' | 'type'>>(
  categories: readonly T[],
  type: MovementType,
  currentCategoryId: string | null = null,
): T[] {
  return categories.filter(category =>
    isCategoryAllowed(category, type, currentCategoryId),
  );
}

// Validación de formato de HU4-CA01 a HU4-CA06. La existencia y el tipo de la categoría se
// comprueban en el servicio con la base.
export function validateMovementInput(
  input: MovementInput,
  today: IsoDate,
): MovementFieldErrors {
  const errors: MovementFieldErrors = {};
  if (!isMovementType(input.type)) {
    errors.type = 'required';
  }
  if (parseAmountInput(input.amount) === null) {
    errors.amount = 'invalid';
  }
  if (input.date.trim().length === 0) {
    errors.date = 'required';
  } else {
    const date = parseDisplayDate(input.date);
    if (date === null) {
      errors.date = 'invalid';
    } else if (isAfter(date, today)) {
      errors.date = 'future';
    }
  }
  if (input.categoryId.length === 0) {
    errors.categoryId = 'required';
  }
  const description = normalizeDescription(input.description);
  if (
    description !== null &&
    codePointLength(description) > DESCRIPTION_MAX_LENGTH
  ) {
    errors.description = 'too_long';
  }
  return errors;
}

export function toValidMovementInput(
  input: MovementInput,
  today: IsoDate,
): MovementValues | null {
  if (Object.keys(validateMovementInput(input, today)).length > 0) {
    return null;
  }
  return {
    type: input.type as MovementType,
    amountCents: parseAmountInput(input.amount) as number,
    occurredOn: parseDisplayDate(input.date) as IsoDate,
    categoryId: input.categoryId,
    description: normalizeDescription(input.description),
  };
}

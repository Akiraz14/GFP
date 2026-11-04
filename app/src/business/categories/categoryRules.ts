import {
  CATEGORY_ICON_IDS,
  CATEGORY_TYPES,
  type CategoryIconId,
  type CategoryType,
} from '../../infrastructure/database/categoryCatalogs';

// Reglas del nombre, el tipo y el ícono de una categoría (HU8-CA03 a HU8-CA06, E06-D9).

export const CATEGORY_NAME_MAX_LENGTH = 40;

export type CategoryInput = {
  name: string;
  type: string;
  icon: string;
};

export type ValidCategoryInput = {
  name: string;
  nameNormalized: string;
  type: CategoryType;
  icon: CategoryIconId;
};

export type CategoryField = 'name' | 'type' | 'icon';
export type CategoryFieldError = 'required' | 'too_long' | 'invalid';
export type CategoryFieldErrors = Partial<
  Record<CategoryField, CategoryFieldError>
>;

// Nombre que se guarda y se muestra: sin espacios al inicio ni al final, con los espacios
// internos (incluidos saltos de línea y tabulaciones) reducidos a uno y en forma NFC.
export function normalizeCategoryName(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim();
}

// Clave de comparación de duplicados (HU8-CA04): no distingue mayúsculas y minúsculas,
// pero sí tildes (E06-D9). Se calcula aquí porque `lower()` de SQLite solo convierte ASCII.
export function categoryNameKey(raw: string): string {
  return normalizeCategoryName(raw).toLocaleLowerCase('es-CO');
}

export function isCategoryType(value: string): value is CategoryType {
  return (CATEGORY_TYPES as readonly string[]).includes(value);
}

export function isCategoryIcon(value: string): value is CategoryIconId {
  return (CATEGORY_ICON_IDS as readonly string[]).includes(value);
}

export function validateCategoryInput(
  input: CategoryInput,
): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};
  const name = normalizeCategoryName(input.name);
  if (name.length === 0) {
    errors.name = 'required';
  } else if (
    name.length > CATEGORY_NAME_MAX_LENGTH ||
    categoryNameKey(name).length > CATEGORY_NAME_MAX_LENGTH
  ) {
    errors.name = 'too_long';
  }
  if (input.type.length === 0) {
    errors.type = 'required';
  } else if (!isCategoryType(input.type)) {
    errors.type = 'invalid';
  }
  if (input.icon.length === 0) {
    errors.icon = 'required';
  } else if (!isCategoryIcon(input.icon)) {
    errors.icon = 'invalid';
  }
  return errors;
}

// Devuelve la entrada lista para guardar, o null si tiene errores.
export function toValidCategoryInput(
  input: CategoryInput,
): ValidCategoryInput | null {
  if (Object.keys(validateCategoryInput(input)).length > 0) {
    return null;
  }
  const name = normalizeCategoryName(input.name);
  return {
    name,
    nameNormalized: categoryNameKey(name),
    type: input.type as CategoryType,
    icon: input.icon as CategoryIconId,
  };
}

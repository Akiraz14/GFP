// Catálogos de HU8 (Etapa 06). Las 9 categorías del sistema son las de HU8-CA01, con los
// tipos del prototipo (E06-D2). Los íconos se guardan por identificador; su representación
// gráfica se resuelve en la capa de presentación (E06-D5).

export type CategoryType = 'income' | 'expense';

export const CATEGORY_TYPES: readonly CategoryType[] = ['income', 'expense'];

export type CategoryIconId =
  | 'food'
  | 'car'
  | 'home'
  | 'gamepad'
  | 'heart'
  | 'book'
  | 'shopping-bag'
  | 'wallet'
  | 'more'
  | 'cart'
  | 'gift'
  | 'pet'
  | 'dumbbell'
  | 'briefcase'
  | 'plane';

// Orden en el que el selector muestra los íconos (E06-D5).
export const CATEGORY_ICON_IDS: readonly CategoryIconId[] = [
  'cart',
  'home',
  'car',
  'food',
  'heart',
  'book',
  'gift',
  'pet',
  'dumbbell',
  'briefcase',
  'plane',
  'more',
  'gamepad',
  'shopping-bag',
  'wallet',
];

export type SystemCategorySeed = {
  id: string;
  name: string;
  // Clave de comparación de duplicados (E06-D9). Se escribe literal para que la migración
  // sea determinista aunque cambie después la función de normalización.
  nameNormalized: string;
  type: CategoryType;
  icon: CategoryIconId;
};

// Identificador fijo de «Otros», destino de la reasignación de HU8-CA07c (Etapa 07).
export const OTHER_CATEGORY_ID = 'other';

export const SYSTEM_CATEGORIES: readonly SystemCategorySeed[] = [
  {
    id: 'food',
    name: 'Alimentación',
    nameNormalized: 'alimentación',
    type: 'expense',
    icon: 'food',
  },
  {
    id: 'transport',
    name: 'Transporte',
    nameNormalized: 'transporte',
    type: 'expense',
    icon: 'car',
  },
  {
    id: 'housing',
    name: 'Vivienda',
    nameNormalized: 'vivienda',
    type: 'expense',
    icon: 'home',
  },
  {
    id: 'entertainment',
    name: 'Entretenimiento',
    nameNormalized: 'entretenimiento',
    type: 'expense',
    icon: 'gamepad',
  },
  {
    id: 'health',
    name: 'Salud',
    nameNormalized: 'salud',
    type: 'expense',
    icon: 'heart',
  },
  {
    id: 'education',
    name: 'Educación',
    nameNormalized: 'educación',
    type: 'expense',
    icon: 'book',
  },
  {
    id: 'shopping',
    name: 'Compras',
    nameNormalized: 'compras',
    type: 'expense',
    icon: 'shopping-bag',
  },
  {
    id: 'salary',
    name: 'Salario',
    nameNormalized: 'salario',
    type: 'income',
    icon: 'wallet',
  },
  {
    id: OTHER_CATEGORY_ID,
    name: 'Otros',
    nameNormalized: 'otros',
    type: 'expense',
    icon: 'more',
  },
];

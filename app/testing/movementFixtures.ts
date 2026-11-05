// Movimientos de prueba para las funciones de HU9 y HU10 (de daniela888-li/GFP, 8bfa533).
import type { MovementListItem } from '../src/infrastructure/database/repositories/movementRepository';

let sequence = 0;

export function item(
  date: string,
  type: 'income' | 'expense',
  amountCents: number,
  categoryId = 'food',
  categoryName = 'Alimentación',
): MovementListItem {
  sequence += 1;
  return {
    id: `m${sequence}`,
    categoryId,
    categoryName,
    categoryIcon: 'food',
    type,
    amountCents,
    occurredOn: date,
    description: null,
    createdAt: 1,
    updatedAt: 1,
  };
}

import type {
  SessionManager,
  UserSession,
} from '../../../services/session/sessionManager';
import type { CategoryType } from '../categoryCatalogs';
import {
  readInteger,
  readOptionalText,
  readText,
  type SqlExecutor,
  type SqlRow,
} from '../sqlDatabase';
import { OwnedRepository } from './ownedRepository';

export type MovementType = CategoryType;

export type Movement = {
  id: string;
  type: MovementType;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
};

export type MovementValues = {
  type: MovementType;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  description: string | null;
};

const COLUMNS =
  'id, type, amount_cents, occurred_on, category_id, description, created_at, updated_at';

function toMovement(row: SqlRow): Movement {
  return {
    id: readText(row, 'id'),
    type: readText(row, 'type') as MovementType,
    amountCents: readInteger(row, 'amount_cents'),
    occurredOn: readText(row, 'occurred_on'),
    categoryId: readText(row, 'category_id'),
    description: readOptionalText(row, 'description'),
    createdAt: readInteger(row, 'created_at'),
    updatedAt: readInteger(row, 'updated_at'),
  };
}

// Acceso a `movements` (HU4). Ninguna operación recibe un `userId`: el propietario sale de
// la sesión activa (E02-D4, HU2-CA11).
export class MovementRepository extends OwnedRepository {
  constructor(executor: SqlExecutor, sessions: SessionManager) {
    super(executor, sessions);
  }

  async findOwn(session: UserSession, id: string): Promise<Movement | null> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `SELECT ${COLUMNS} FROM movements WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    return result.rows.length === 0 ? null : toMovement(result.rows[0]);
  }

  async createOwn(
    session: UserSession,
    id: string,
    values: MovementValues,
    now: number,
  ): Promise<Movement> {
    const userId = this.ownerOf(session);
    await this.executor.execute(
      `INSERT INTO movements (id, user_id, type, amount_cents, occurred_on, category_id,
         description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        values.type,
        values.amountCents,
        values.occurredOn,
        values.categoryId,
        values.description,
        now,
        now,
      ],
    );
    return { id, ...values, createdAt: now, updatedAt: now };
  }

  // Devuelve false si el movimiento no existe o es de otro usuario.
  async updateOwn(
    session: UserSession,
    id: string,
    values: MovementValues,
    now: number,
  ): Promise<boolean> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `UPDATE movements SET type = ?, amount_cents = ?, occurred_on = ?, category_id = ?,
         description = ?, updated_at = ?
        WHERE id = ? AND user_id = ?`,
      [
        values.type,
        values.amountCents,
        values.occurredOn,
        values.categoryId,
        values.description,
        now,
        id,
        userId,
      ],
    );
    return result.rowsAffected === 1;
  }

  // Movimientos del usuario asociados a una categoría (recuento del modal de HU8-CA07b).
  async countByCategory(
    session: UserSession,
    categoryId: string,
  ): Promise<number> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      'SELECT count(*) AS total FROM movements WHERE user_id = ? AND category_id = ?',
      [userId, categoryId],
    );
    return readInteger(result.rows[0], 'total');
  }

  // HU8-CA07c con E06-D3: los movimientos pasan a la categoría de destino («Otros») y
  // conservan su tipo. Devuelve cuántos movimientos cambiaron.
  async reassignCategory(
    session: UserSession,
    fromCategoryId: string,
    toCategoryId: string,
    now: number,
  ): Promise<number> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `UPDATE movements SET category_id = ?, updated_at = ?
        WHERE user_id = ? AND category_id = ?`,
      [toCategoryId, now, userId, fromCategoryId],
    );
    return result.rowsAffected;
  }
}

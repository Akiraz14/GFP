import type {
  SessionManager,
  UserSession,
} from '../../../services/session/sessionManager';
import type { CategoryIconId, CategoryType } from '../categoryCatalogs';
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

// Filtros del historial (HU5-CA03): cada campo nulo no filtra. Las fechas son `AAAA-MM-DD`
// e incluyen ambos extremos.
export type MovementFilters = {
  from: string | null;
  to: string | null;
  type: MovementType | null;
  categoryId: string | null;
};

export const NO_MOVEMENT_FILTERS: MovementFilters = {
  from: null,
  to: null,
  type: null,
  categoryId: null,
};

// Movimiento del historial con el nombre y el ícono de su categoría (HU5).
export type MovementListItem = Movement & {
  categoryName: string;
  categoryIcon: CategoryIconId;
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

function toListItem(row: SqlRow): MovementListItem {
  return {
    ...toMovement(row),
    categoryName: readText(row, 'category_name'),
    categoryIcon: readText(row, 'category_icon') as CategoryIconId,
  };
}

// Acceso a `movements` (HU4, HU5). Ninguna operación recibe un `userId`: el propietario sale de
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

  // HU5-CA01 y CA03: movimientos del usuario que cumplen todos los filtros, del más reciente
  // al más antiguo (fecha del movimiento y, en la misma fecha, el último registrado primero).
  async listOwn(
    session: UserSession,
    filters: MovementFilters,
  ): Promise<MovementListItem[]> {
    const userId = this.ownerOf(session);
    const conditions = ['m.user_id = ?'];
    const params: string[] = [userId];
    if (filters.from !== null) {
      conditions.push('m.occurred_on >= ?');
      params.push(filters.from);
    }
    if (filters.to !== null) {
      conditions.push('m.occurred_on <= ?');
      params.push(filters.to);
    }
    if (filters.type !== null) {
      conditions.push('m.type = ?');
      params.push(filters.type);
    }
    if (filters.categoryId !== null) {
      conditions.push('m.category_id = ?');
      params.push(filters.categoryId);
    }
    const result = await this.executor.execute(
      `SELECT m.id, m.type, m.amount_cents, m.occurred_on, m.category_id, m.description,
         m.created_at, m.updated_at, c.name AS category_name, c.icon AS category_icon
         FROM movements m JOIN categories c ON c.id = m.category_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY m.occurred_on DESC, m.created_at DESC, m.rowid DESC`,
      params,
    );
    return result.rows.map(toListItem);
  }

  // HU5-CA06: borrado físico (plan aprobado). Devuelve false si el movimiento no existe o es
  // de otro usuario.
  async deleteOwn(session: UserSession, id: string): Promise<boolean> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      'DELETE FROM movements WHERE id = ? AND user_id = ?',
      [id, userId],
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

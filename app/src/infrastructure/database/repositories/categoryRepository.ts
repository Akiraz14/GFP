import type {
  SessionManager,
  UserSession,
} from '../../../services/session/sessionManager';
import type { CategoryIconId, CategoryType } from '../categoryCatalogs';
import {
  readInteger,
  readText,
  type SqlExecutor,
  type SqlRow,
} from '../sqlDatabase';
import { OwnedRepository } from './ownedRepository';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon: CategoryIconId;
  isSystem: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CategoryValues = {
  name: string;
  nameNormalized: string;
  type: CategoryType;
  icon: CategoryIconId;
};

const COLUMNS = 'id, name, type, icon, is_system, created_at, updated_at';

function toCategory(row: SqlRow): Category {
  return {
    id: readText(row, 'id'),
    name: readText(row, 'name'),
    type: readText(row, 'type') as CategoryType,
    icon: readText(row, 'icon') as CategoryIconId,
    isSystem: readInteger(row, 'is_system') === 1,
    createdAt: readInteger(row, 'created_at'),
    updatedAt: readInteger(row, 'updated_at'),
  };
}

// Acceso a `categories` (HU8). Ninguna operación recibe un `userId`: el propietario sale de
// la sesión activa (E02-D4). Un usuario ve las 9 categorías del sistema y las suyas, y solo
// puede modificar o eliminar las suyas (HU8-CA06, HU8-CA07a).
export class CategoryRepository extends OwnedRepository {
  constructor(executor: SqlExecutor, sessions: SessionManager) {
    super(executor, sessions);
  }

  // Categorías vigentes para HU8, y para el formulario de HU4 y los filtros de HU5
  // (HU8-CA08): primero las del sistema en su orden y después las propias por fecha de
  // creación (E06-D9). Se lee siempre de la base, sin caché.
  async listForOwner(
    session: UserSession,
    type?: CategoryType,
  ): Promise<Category[]> {
    const userId = this.ownerOf(session);
    const params = type === undefined ? [userId] : [userId, type];
    const result = await this.executor.execute(
      `SELECT ${COLUMNS} FROM categories
        WHERE (is_system = 1 OR user_id = ?)${
          type === undefined ? '' : ' AND type = ?'
        }
        ORDER BY is_system DESC, sort_order, created_at, rowid`,
      params,
    );
    return result.rows.map(toCategory);
  }

  // Busca una categoría visible para el usuario: del sistema o propia. Una categoría de
  // otro usuario se trata como inexistente.
  async findAccessible(
    session: UserSession,
    id: string,
  ): Promise<Category | null> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `SELECT ${COLUMNS} FROM categories
        WHERE id = ? AND (is_system = 1 OR user_id = ?)`,
      [id, userId],
    );
    return result.rows.length === 0 ? null : toCategory(result.rows[0]);
  }

  // HU8-CA04 con E06-D1: el nombre se compara con las categorías del sistema y con las
  // propias del usuario, nunca con las de otras cuentas.
  async isNameTaken(
    session: UserSession,
    nameNormalized: string,
    excludeId: string | null = null,
  ): Promise<boolean> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `SELECT count(*) AS total FROM categories
        WHERE name_normalized = ? AND (is_system = 1 OR user_id = ?)
          AND (? IS NULL OR id <> ?)`,
      [nameNormalized, userId, excludeId, excludeId],
    );
    return readInteger(result.rows[0], 'total') > 0;
  }

  async createOwn(
    session: UserSession,
    id: string,
    values: CategoryValues,
    now: number,
  ): Promise<Category> {
    const userId = this.ownerOf(session);
    await this.executor.execute(
      `INSERT INTO categories (id, user_id, is_system, name, name_normalized, type, icon,
         created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        values.name,
        values.nameNormalized,
        values.type,
        values.icon,
        now,
        now,
      ],
    );
    return {
      id,
      name: values.name,
      type: values.type,
      icon: values.icon,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Devuelve false si la categoría no existe, es de otro usuario o es del sistema.
  async updateOwn(
    session: UserSession,
    id: string,
    values: CategoryValues,
    now: number,
  ): Promise<boolean> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `UPDATE categories SET name = ?, name_normalized = ?, type = ?, icon = ?, updated_at = ?
        WHERE id = ? AND user_id = ? AND is_system = 0`,
      [
        values.name,
        values.nameNormalized,
        values.type,
        values.icon,
        now,
        id,
        userId,
      ],
    );
    return result.rowsAffected === 1;
  }

  // Devuelve false si la categoría no existe, es de otro usuario o es del sistema. En la
  // Etapa 07 se reasignan antes, en la misma transacción, los movimientos a «Otros»
  // (HU8-CA07c, E06-D7).
  async deleteOwn(session: UserSession, id: string): Promise<boolean> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      'DELETE FROM categories WHERE id = ? AND user_id = ? AND is_system = 0',
      [id, userId],
    );
    return result.rowsAffected === 1;
  }
}

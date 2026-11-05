import { CategoryRepository } from '../../infrastructure/database/repositories/categoryRepository';
import {
  MovementRepository,
  type Movement,
  type MovementFilters,
  type MovementListItem,
} from '../../infrastructure/database/repositories/movementRepository';
import type {
  SqlDatabase,
  SqlExecutor,
} from '../../infrastructure/database/sqlDatabase';
import {
  randomUuid,
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';
import { serializedByDatabase } from '../../services/databaseQueue';
import {
  SessionError,
  type SessionManager,
  type UserSession,
} from '../../services/session/sessionManager';
import { todayIso } from '../dates/localDate';
import {
  isCategoryAllowed,
  toValidMovementInput,
  validateMovementInput,
  type MovementFieldErrors,
  type MovementInput,
} from './movementRules';

// Gestión de Movimientos (C4, HU4). Las operaciones exigen la sesión activa; si la sesión ya
// no es válida responden `session_expired` y no leen ni escriben nada (HU2-CA10, E02-D4).

export type MovementGetResult =
  | { status: 'ok'; movement: Movement }
  | { status: 'not_found' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type MovementSaveResult =
  | { status: 'saved'; movement: Movement }
  | { status: 'invalid_input'; errors: MovementFieldErrors }
  | { status: 'not_found' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type MovementListResult =
  | { status: 'ok'; movements: MovementListItem[] }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type MovementDeleteResult =
  | { status: 'deleted' }
  | { status: 'not_found' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export interface MovementGateway {
  // HU5-CA01 y CA03.
  list(
    session: UserSession,
    filters: MovementFilters,
  ): Promise<MovementListResult>;
  get(session: UserSession, id: string): Promise<MovementGetResult>;
  create(
    session: UserSession,
    input: MovementInput,
  ): Promise<MovementSaveResult>;
  update(
    session: UserSession,
    id: string,
    input: MovementInput,
  ): Promise<MovementSaveResult>;
  // HU5-CA06.
  remove(session: UserSession, id: string): Promise<MovementDeleteResult>;
}

export type MovementManagementDependencies = {
  database: SqlDatabase;
  sessions: SessionManager;
  random?: RandomBytesSource;
  now?: () => number;
};

function failureStatus(error: unknown): 'session_expired' | 'failed' {
  return error instanceof SessionError ? 'session_expired' : 'failed';
}

export class MovementManagementService implements MovementGateway {
  private readonly random: RandomBytesSource;
  private readonly now: () => number;

  constructor(private readonly dependencies: MovementManagementDependencies) {
    this.random = dependencies.random ?? secureRandomBytes;
    this.now = dependencies.now ?? Date.now;
  }

  private movements(executor: SqlExecutor): MovementRepository {
    return new MovementRepository(executor, this.dependencies.sessions);
  }

  private categories(executor: SqlExecutor): CategoryRepository {
    return new CategoryRepository(executor, this.dependencies.sessions);
  }

  async list(
    session: UserSession,
    filters: MovementFilters,
  ): Promise<MovementListResult> {
    try {
      const movements = await this.movements(
        this.dependencies.database,
      ).listOwn(session, filters);
      return { status: 'ok', movements };
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  async remove(
    session: UserSession,
    id: string,
  ): Promise<MovementDeleteResult> {
    try {
      const deleted = await serializedByDatabase(
        this.dependencies.database,
        () => this.movements(this.dependencies.database).deleteOwn(session, id),
      );
      return deleted ? { status: 'deleted' } : { status: 'not_found' };
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  async get(session: UserSession, id: string): Promise<MovementGetResult> {
    try {
      const movement = await this.movements(this.dependencies.database).findOwn(
        session,
        id,
      );
      return movement === null
        ? { status: 'not_found' }
        : { status: 'ok', movement };
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  // Comprueba que la categoría sea visible para el usuario y compatible con el tipo (D-02,
  // E06-D3).
  private async categoryErrors(
    executor: SqlExecutor,
    session: UserSession,
    input: MovementInput,
    currentCategoryId: string | null,
  ): Promise<MovementFieldErrors> {
    const category = await this.categories(executor).findAccessible(
      session,
      input.categoryId,
    );
    if (category === null) {
      return { categoryId: 'required' };
    }
    if (
      !isCategoryAllowed(
        category,
        input.type as Movement['type'],
        currentCategoryId,
      )
    ) {
      return { categoryId: 'incompatible' };
    }
    return {};
  }

  async create(
    session: UserSession,
    input: MovementInput,
  ): Promise<MovementSaveResult> {
    const today = todayIso(this.now());
    const valid = toValidMovementInput(input, today);
    if (valid === null) {
      return {
        status: 'invalid_input',
        errors: validateMovementInput(input, today),
      };
    }
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.dependencies.database.transaction(
          async (executor): Promise<MovementSaveResult> => {
            const errors = await this.categoryErrors(
              executor,
              session,
              input,
              null,
            );
            if (Object.keys(errors).length > 0) {
              return { status: 'invalid_input', errors };
            }
            const movement = await this.movements(executor).createOwn(
              session,
              randomUuid(this.random),
              valid,
              this.now(),
            );
            return { status: 'saved', movement };
          },
        ),
      );
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  async update(
    session: UserSession,
    id: string,
    input: MovementInput,
  ): Promise<MovementSaveResult> {
    const today = todayIso(this.now());
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.dependencies.database.transaction(
          async (executor): Promise<MovementSaveResult> => {
            const repository = this.movements(executor);
            const current = await repository.findOwn(session, id);
            if (current === null) {
              return { status: 'not_found' };
            }
            const valid = toValidMovementInput(input, today);
            if (valid === null) {
              return {
                status: 'invalid_input',
                errors: validateMovementInput(input, today),
              };
            }
            const errors = await this.categoryErrors(
              executor,
              session,
              input,
              current.categoryId,
            );
            if (Object.keys(errors).length > 0) {
              return { status: 'invalid_input', errors };
            }
            const now = this.now();
            if (!(await repository.updateOwn(session, id, valid, now))) {
              return { status: 'not_found' };
            }
            return {
              status: 'saved',
              movement: { ...current, ...valid, updatedAt: now },
            };
          },
        ),
      );
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }
}

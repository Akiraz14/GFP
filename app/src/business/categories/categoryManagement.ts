import type { CategoryType } from '../../infrastructure/database/categoryCatalogs';
import {
  CategoryRepository,
  type Category,
} from '../../infrastructure/database/repositories/categoryRepository';
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
import {
  categoryNameKey,
  toValidCategoryInput,
  validateCategoryInput,
  type CategoryFieldErrors,
  type CategoryInput,
} from './categoryRules';

// Gestión de Categorías (C4, HU8). Las operaciones exigen la sesión activa; si la sesión ya
// no es válida responden `session_expired` y no leen ni escriben nada (HU2-CA10, E02-D4).

export type CategoryListResult =
  | { status: 'ok'; categories: Category[] }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type CategorySaveResult =
  | { status: 'saved'; category: Category }
  | { status: 'invalid_input'; errors: CategoryFieldErrors }
  | { status: 'duplicate_name' }
  | { status: 'not_found' }
  | { status: 'protected' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type CategoryDeleteResult =
  | { status: 'deleted' }
  | { status: 'not_found' }
  | { status: 'protected' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type CategoryNameCheckResult =
  | { status: 'available' }
  | { status: 'taken' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export interface CategoryGateway {
  listActiveCategories(
    session: UserSession,
    type?: CategoryType,
  ): Promise<CategoryListResult>;
  // Comprobación mientras se escribe el nombre (prototipo, E06-D6). La regla definitiva se
  // vuelve a aplicar al guardar.
  checkName(
    session: UserSession,
    name: string,
    excludeId?: string,
  ): Promise<CategoryNameCheckResult>;
  create(
    session: UserSession,
    input: CategoryInput,
  ): Promise<CategorySaveResult>;
  update(
    session: UserSession,
    id: string,
    input: CategoryInput,
  ): Promise<CategorySaveResult>;
  remove(session: UserSession, id: string): Promise<CategoryDeleteResult>;
}

export type CategoryManagementDependencies = {
  database: SqlDatabase;
  sessions: SessionManager;
  random?: RandomBytesSource;
  now?: () => number;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Respuesta a los errores de la base: los disparadores y los índices únicos de la migración 4
// son la última barrera si la validación del servicio se saltara.
function fromDatabaseError(
  error: unknown,
): 'duplicate_name' | 'protected' | 'session_expired' | 'failed' {
  if (error instanceof SessionError) {
    return 'session_expired';
  }
  const message = errorMessage(error);
  if (
    /category_name_taken/.test(message) ||
    /UNIQUE constraint failed: categories/.test(message)
  ) {
    return 'duplicate_name';
  }
  if (/system_category_protected|category_owner_immutable/.test(message)) {
    return 'protected';
  }
  return 'failed';
}

export class CategoryManagementService implements CategoryGateway {
  private readonly random: RandomBytesSource;
  private readonly now: () => number;

  constructor(private readonly dependencies: CategoryManagementDependencies) {
    this.random = dependencies.random ?? secureRandomBytes;
    this.now = dependencies.now ?? Date.now;
  }

  private repository(
    executor: SqlExecutor = this.dependencies.database,
  ): CategoryRepository {
    return new CategoryRepository(executor, this.dependencies.sessions);
  }

  async listActiveCategories(
    session: UserSession,
    type?: CategoryType,
  ): Promise<CategoryListResult> {
    try {
      const categories = await this.repository().listForOwner(session, type);
      return { status: 'ok', categories };
    } catch (error) {
      return {
        status: error instanceof SessionError ? 'session_expired' : 'failed',
      };
    }
  }

  async checkName(
    session: UserSession,
    name: string,
    excludeId?: string,
  ): Promise<CategoryNameCheckResult> {
    try {
      const taken = await this.repository().isNameTaken(
        session,
        categoryNameKey(name),
        excludeId ?? null,
      );
      return { status: taken ? 'taken' : 'available' };
    } catch (error) {
      return {
        status: error instanceof SessionError ? 'session_expired' : 'failed',
      };
    }
  }

  async create(
    session: UserSession,
    input: CategoryInput,
  ): Promise<CategorySaveResult> {
    const valid = toValidCategoryInput(input);
    if (valid === null) {
      return { status: 'invalid_input', errors: validateCategoryInput(input) };
    }
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.dependencies.database.transaction(async executor => {
          const repository = this.repository(executor);
          if (await repository.isNameTaken(session, valid.nameNormalized)) {
            return { status: 'duplicate_name' } as const;
          }
          const category = await repository.createOwn(
            session,
            randomUuid(this.random),
            valid,
            this.now(),
          );
          return { status: 'saved', category } as const;
        }),
      );
    } catch (error) {
      return { status: fromDatabaseError(error) };
    }
  }

  async update(
    session: UserSession,
    id: string,
    input: CategoryInput,
  ): Promise<CategorySaveResult> {
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.dependencies.database.transaction(
          async (executor): Promise<CategorySaveResult> => {
            const repository = this.repository(executor);
            const current = await repository.findAccessible(session, id);
            if (current === null) {
              return { status: 'not_found' };
            }
            if (current.isSystem) {
              return { status: 'protected' };
            }
            const valid = toValidCategoryInput(input);
            if (valid === null) {
              return {
                status: 'invalid_input',
                errors: validateCategoryInput(input),
              };
            }
            if (
              await repository.isNameTaken(session, valid.nameNormalized, id)
            ) {
              return { status: 'duplicate_name' };
            }
            const now = this.now();
            if (!(await repository.updateOwn(session, id, valid, now))) {
              return { status: 'not_found' };
            }
            return {
              status: 'saved',
              category: { ...current, ...valid, updatedAt: now },
            };
          },
        ),
      );
    } catch (error) {
      return { status: fromDatabaseError(error) };
    }
  }

  async remove(
    session: UserSession,
    id: string,
  ): Promise<CategoryDeleteResult> {
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.dependencies.database.transaction(
          async (executor): Promise<CategoryDeleteResult> => {
            const repository = this.repository(executor);
            const current = await repository.findAccessible(session, id);
            if (current === null) {
              return { status: 'not_found' };
            }
            if (current.isSystem) {
              return { status: 'protected' };
            }
            // Etapa 07: aquí se reasignan los movimientos de la categoría a «Otros»
            // (OTHER_CATEGORY_ID), en esta misma transacción (HU8-CA07c, E06-D7).
            return (await repository.deleteOwn(session, id))
              ? { status: 'deleted' }
              : { status: 'not_found' };
          },
        ),
      );
    } catch (error) {
      const reason = fromDatabaseError(error);
      return { status: reason === 'duplicate_name' ? 'failed' : reason };
    }
  }
}

import { monthRange } from '../../analysis/financialAnalysis';
import {
  evaluateRecommendations,
  monthOf,
  type Recommendation,
} from '../../analysis/recommendations';
import { MovementRepository } from '../../infrastructure/database/repositories/movementRepository';
import { RecommendationDismissalRepository } from '../../infrastructure/database/repositories/recommendationDismissalRepository';
import type { SqlDatabase } from '../../infrastructure/database/sqlDatabase';
import { serializedByDatabase } from '../../services/databaseQueue';
import {
  SessionError,
  type SessionManager,
  type UserSession,
} from '../../services/session/sessionManager';
import { todayIso } from '../dates/localDate';

// Generador de Recomendaciones (C4, HU10). Lee de la base local solo los movimientos del
// usuario de la sesión (mes anterior y mes actual), aplica R1 a R3 y oculta las recomendaciones
// descartadas en el mes actual (I-27).

export type RecommendationListResult =
  | { status: 'ok'; recommendations: Recommendation[] }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type RecommendationDismissResult =
  | { status: 'dismissed' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export interface RecommendationGateway {
  list(session: UserSession): Promise<RecommendationListResult>;
  dismiss(
    session: UserSession,
    recommendationId: string,
  ): Promise<RecommendationDismissResult>;
}

export type RecommendationServiceDependencies = {
  database: SqlDatabase;
  sessions: SessionManager;
  now?: () => number;
};

function failureStatus(error: unknown): 'session_expired' | 'failed' {
  return error instanceof SessionError ? 'session_expired' : 'failed';
}

export class RecommendationService implements RecommendationGateway {
  private readonly now: () => number;

  constructor(
    private readonly dependencies: RecommendationServiceDependencies,
  ) {
    this.now = dependencies.now ?? Date.now;
  }

  async list(session: UserSession): Promise<RecommendationListResult> {
    const { database, sessions } = this.dependencies;
    try {
      const today = todayIso(this.now());
      const movements = await new MovementRepository(
        database,
        sessions,
      ).listOwn(session, {
        from: monthRange(today, -1).from,
        to: monthRange(today).to,
        type: null,
        categoryId: null,
      });
      const dismissed = await new RecommendationDismissalRepository(
        database,
        sessions,
      ).listForPeriod(session, monthOf(today));
      return {
        status: 'ok',
        recommendations: evaluateRecommendations(movements, today).filter(
          recommendation => !dismissed.has(recommendation.id),
        ),
      };
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  async dismiss(
    session: UserSession,
    recommendationId: string,
  ): Promise<RecommendationDismissResult> {
    const { database, sessions } = this.dependencies;
    try {
      const now = this.now();
      await serializedByDatabase(database, () =>
        new RecommendationDismissalRepository(database, sessions).dismiss(
          session,
          recommendationId,
          monthOf(todayIso(now)),
          now,
        ),
      );
      return { status: 'dismissed' };
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }
}

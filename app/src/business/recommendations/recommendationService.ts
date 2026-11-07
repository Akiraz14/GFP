import { monthRange } from '../../analysis/financialAnalysis';
import {
  evaluateRecommendations,
  type Recommendation,
} from '../../analysis/recommendations';
import { MovementRepository } from '../../infrastructure/database/repositories/movementRepository';
import type { SqlDatabase } from '../../infrastructure/database/sqlDatabase';
import {
  SessionError,
  type SessionManager,
  type UserSession,
} from '../../services/session/sessionManager';
import { todayIso } from '../dates/localDate';

// Generador de Recomendaciones (C4, HU10). Lee de la base local solo los movimientos del
// usuario de la sesión (mes anterior y mes actual), aplica las reglas y oculta las
// recomendaciones descartadas en la sesión actual.
//
// AJ-05 (E-AJ-D2): «Descartar» oculta la tarjeta solo durante la sesión («quitar
// temporalmente», HU10). El descarte vive en memoria, ligado al `sessionId`: al cerrar sesión o
// la aplicación se pierde y la regla vuelve a mostrarse si se sigue cumpliendo. Ya no se lee ni
// se escribe la tabla `recommendation_dismissals` de la migración 6 (que no se modifica).

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
  private dismissed: { sessionId: string; ids: Set<string> } | null = null;

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
      const dismissed = this.dismissedFor(session);
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
    try {
      this.dependencies.sessions.requireOwner(session);
      this.dismissedFor(session).add(recommendationId);
      return { status: 'dismissed' };
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  private dismissedFor(session: UserSession): Set<string> {
    if (this.dismissed?.sessionId !== session.sessionId) {
      this.dismissed = { sessionId: session.sessionId, ids: new Set() };
    }
    return this.dismissed.ids;
  }
}

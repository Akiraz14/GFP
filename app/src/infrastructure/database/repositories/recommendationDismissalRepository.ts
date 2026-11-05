import type {
  SessionManager,
  UserSession,
} from '../../../services/session/sessionManager';
import { readText, type SqlExecutor } from '../sqlDatabase';
import { OwnedRepository } from './ownedRepository';

// Descartes de recomendaciones de HU10 (I-27). El propietario sale de la sesión activa.
export class RecommendationDismissalRepository extends OwnedRepository {
  constructor(executor: SqlExecutor, sessions: SessionManager) {
    super(executor, sessions);
  }

  async listForPeriod(
    session: UserSession,
    period: string,
  ): Promise<Set<string>> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `SELECT recommendation_id FROM recommendation_dismissals
        WHERE user_id = ? AND period = ?`,
      [userId, period],
    );
    return new Set(result.rows.map(row => readText(row, 'recommendation_id')));
  }

  // Descartar dos veces la misma recomendación en el mismo mes no cambia nada.
  async dismiss(
    session: UserSession,
    recommendationId: string,
    period: string,
    now: number,
  ): Promise<void> {
    const userId = this.ownerOf(session);
    await this.executor.execute(
      `INSERT OR IGNORE INTO recommendation_dismissals
         (user_id, recommendation_id, period, dismissed_at) VALUES (?, ?, ?, ?)`,
      [userId, recommendationId, period, now],
    );
  }
}

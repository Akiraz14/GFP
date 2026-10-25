import type {
  SessionManager,
  UserSession,
} from '../../../services/session/sessionManager';
import type { SqlExecutor } from '../sqlDatabase';

export abstract class OwnedRepository {
  protected constructor(
    protected readonly executor: SqlExecutor,
    private readonly sessions: SessionManager,
  ) {}

  protected ownerOf(session: UserSession): string {
    return this.sessions.requireOwner(session);
  }
}

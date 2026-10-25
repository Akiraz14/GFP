import {
  randomUuid,
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';

export type UserSession = Readonly<{
  sessionId: string;
  userId: string;
  startedAt: number;
}>;

export class SessionError extends Error {
  readonly reason: 'no_active_session' | 'stale_session';

  constructor(reason: SessionError['reason']) {
    super(`session rejected: ${reason}`);
    this.name = 'SessionError';
    this.reason = reason;
  }
}

export class SessionManager {
  private active: UserSession | null = null;

  constructor(
    private readonly random: RandomBytesSource = secureRandomBytes,
    private readonly now: () => number = Date.now,
  ) {}

  start(userId: string): UserSession {
    this.active = Object.freeze({
      sessionId: randomUuid(this.random),
      userId,
      startedAt: this.now(),
    });
    return this.active;
  }

  end(): void {
    this.active = null;
  }

  current(): UserSession | null {
    return this.active;
  }

  requireOwner(session: UserSession): string {
    if (this.active === null) {
      throw new SessionError('no_active_session');
    }
    if (session !== this.active) {
      throw new SessionError('stale_session');
    }
    return this.active.userId;
  }
}

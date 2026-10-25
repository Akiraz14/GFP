export type ThrottleScope = 'login' | 'recovery';

export type ThrottlePolicy = {
  maxFailures: number;
  baseLockMs: number;
  lockMultiplier: number;
  maxLockMs: number;
};

export type ThrottleState = {
  failureCount: number;
  lockLevel: number;
  lockedUntil: number | null;
  lastFailureAt: number | null;
};

const MINUTE_MS = 60_000;

export const LOGIN_THROTTLE_POLICY: ThrottlePolicy = {
  maxFailures: 3,
  baseLockMs: 15 * MINUTE_MS,
  lockMultiplier: 1,
  maxLockMs: 15 * MINUTE_MS,
};

export const RECOVERY_THROTTLE_POLICY: ThrottlePolicy = {
  maxFailures: 3,
  baseLockMs: 15 * MINUTE_MS,
  lockMultiplier: 2,
  maxLockMs: 24 * 60 * MINUTE_MS,
};

export const EMPTY_THROTTLE_STATE: ThrottleState = {
  failureCount: 0,
  lockLevel: 0,
  lockedUntil: null,
  lastFailureAt: null,
};

export function remainingLockMs(state: ThrottleState, now: number): number {
  if (state.lastFailureAt !== null && now < state.lastFailureAt) {
    return state.lockedUntil === null
      ? 0
      : Math.max(state.lockedUntil - state.lastFailureAt, 1);
  }
  return state.lockedUntil === null ? 0 : Math.max(state.lockedUntil - now, 0);
}

export function isLocked(state: ThrottleState, now: number): boolean {
  return remainingLockMs(state, now) > 0;
}

export function registerFailure(
  state: ThrottleState,
  policy: ThrottlePolicy,
  now: number,
): ThrottleState {
  const lockExpired = state.lockedUntil !== null && !isLocked(state, now);
  const failureCount = (lockExpired ? 0 : state.failureCount) + 1;
  if (failureCount < policy.maxFailures) {
    return {
      ...state,
      failureCount,
      lockedUntil: lockExpired ? null : state.lockedUntil,
      lastFailureAt: now,
    };
  }
  const lockMs = Math.min(
    policy.baseLockMs * policy.lockMultiplier ** state.lockLevel,
    policy.maxLockMs,
  );
  return {
    failureCount: 0,
    lockLevel: state.lockLevel + 1,
    lockedUntil: now + lockMs,
    lastFailureAt: now,
  };
}

export function registerSuccess(): ThrottleState {
  return { ...EMPTY_THROTTLE_STATE };
}

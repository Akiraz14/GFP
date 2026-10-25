import {
  EMPTY_THROTTLE_STATE,
  isLocked,
  LOGIN_THROTTLE_POLICY,
  RECOVERY_THROTTLE_POLICY,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  type ThrottlePolicy,
  type ThrottleState,
} from '../../../src/services/authentication/attemptThrottle';

const MINUTE = 60_000;

function fail(
  times: number,
  policy: ThrottlePolicy,
  start: ThrottleState,
  at: number,
) {
  let state = start;
  for (let index = 0; index < times; index++) {
    state = registerFailure(state, policy, at);
  }
  return state;
}

describe('attempt throttling', () => {
  test('locks login for 15 minutes after 3 failures (HU2)', () => {
    const state = fail(3, LOGIN_THROTTLE_POLICY, EMPTY_THROTTLE_STATE, 0);
    expect(isLocked(state, 15 * MINUTE - 1)).toBe(true);
    expect(isLocked(state, 15 * MINUTE)).toBe(false);
    expect(
      isLocked(fail(2, LOGIN_THROTTLE_POLICY, EMPTY_THROTTLE_STATE, 0), 1),
    ).toBe(false);
    const again = fail(3, LOGIN_THROTTLE_POLICY, state, 20 * MINUTE);
    expect(remainingLockMs(again, 20 * MINUTE)).toBe(15 * MINUTE);
  });

  test('doubles recovery waits up to 24 hours', () => {
    let state = EMPTY_THROTTLE_STATE;
    let now = 0;
    const waits: number[] = [];
    for (let lock = 0; lock < 9; lock++) {
      state = fail(3, RECOVERY_THROTTLE_POLICY, state, now);
      waits.push(remainingLockMs(state, now) / MINUTE);
      now = state.lockedUntil ?? now;
    }
    expect(waits).toEqual([15, 30, 60, 120, 240, 480, 960, 1440, 1440]);
  });

  test('a success clears failures and lock level', () => {
    expect(registerSuccess()).toEqual(EMPTY_THROTTLE_STATE);
  });

  test('stays locked when the clock moves backwards', () => {
    const state = fail(
      3,
      LOGIN_THROTTLE_POLICY,
      EMPTY_THROTTLE_STATE,
      100 * MINUTE,
    );
    expect(isLocked(state, 50 * MINUTE)).toBe(true);
    expect(remainingLockMs(state, 50 * MINUTE)).toBe(15 * MINUTE);
  });
});

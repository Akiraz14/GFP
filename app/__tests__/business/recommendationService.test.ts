import { MovementManagementService } from '../../src/business/movements/movementManagement';
import type { MovementInput } from '../../src/business/movements/movementRules';
import { RecommendationService } from '../../src/business/recommendations/recommendationService';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const NOVEMBER = new Date(2026, 10, 15, 12).getTime();
const DECEMBER = new Date(2026, 11, 2, 12).getTime();

async function setup() {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  let clock = NOVEMBER;
  const movements = new MovementManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
    now: () => clock,
  });
  const service = new RecommendationService({
    database,
    sessions,
    now: () => clock,
  });
  const session = sessions.start(userId);
  const add = async (input: Partial<MovementInput>) => {
    const result = await movements.create(session, {
      type: 'expense',
      amount: '100',
      date: '03/11/2026',
      categoryId: 'food',
      description: '',
      ...input,
    });
    expect(result.status).toBe('saved');
  };
  return {
    database,
    sessions,
    service,
    session,
    add,
    setClock: (value: number) => {
      clock = value;
    },
  };
}

async function ids(
  service: RecommendationService,
  session: Parameters<RecommendationService['list']>[0],
) {
  const result = await service.list(session);
  if (result.status !== 'ok') {
    throw new Error(result.status);
  }
  return result.recommendations.map(item => item.id);
}

describe('HU10 recommendation service', () => {
  test('evaluates the movements of the session user in the local database', async () => {
    const { service, session, add } = await setup();
    await expect(ids(service, session)).resolves.toEqual([]);
    await add({});
    await expect(ids(service, session)).resolves.toEqual([
      'negative-balance',
      'critical-category-food',
    ]);
  });

  test('I-27: a dismissal hides the card for the rest of the month and is stored', async () => {
    const { database, service, session, add } = await setup();
    await add({});
    await expect(service.dismiss(session, 'negative-balance')).resolves.toEqual(
      {
        status: 'dismissed',
      },
    );
    await expect(service.dismiss(session, 'negative-balance')).resolves.toEqual(
      {
        status: 'dismissed',
      },
    );
    await expect(ids(service, session)).resolves.toEqual([
      'critical-category-food',
    ]);
    const stored = await database.execute(
      'SELECT recommendation_id, period FROM recommendation_dismissals',
    );
    expect(stored.rows).toEqual([
      { recommendation_id: 'negative-balance', period: '2026-11' },
    ]);
  });

  test('I-27: the next month the rule is evaluated again', async () => {
    const { service, session, add, setClock } = await setup();
    await add({ date: '03/11/2026' });
    await service.dismiss(session, 'negative-balance');
    setClock(DECEMBER);
    await add({ date: '01/12/2026' });
    await expect(ids(service, session)).resolves.toContain('negative-balance');
  });

  test('HU2-CA11: dismissals and movements of another user are not used', async () => {
    const { database, sessions, service, session, add } = await setup();
    await add({});
    await service.dismiss(session, 'negative-balance');
    const otherId = await createAccount(
      database,
      profile({
        documentNumber: '2002',
        email: 'luis@example.com',
        phoneNumber: '3002223344',
      }),
    );
    sessions.end();
    const other = sessions.start(otherId);
    await expect(ids(service, other)).resolves.toEqual([]);
  });

  test('HU2-CA10: list and dismiss need the active session', async () => {
    const { database, service, sessions, session, add } = await setup();
    await add({});
    sessions.end();
    await expect(service.list(session)).resolves.toEqual({
      status: 'session_expired',
    });
    await expect(service.dismiss(session, 'negative-balance')).resolves.toEqual(
      {
        status: 'session_expired',
      },
    );
    const stored = await database.execute(
      'SELECT count(*) AS total FROM recommendation_dismissals',
    );
    expect(stored.rows[0]).toEqual({ total: 0 });
  });

  test('a database failure is reported without details', async () => {
    const { database, service, session } = await setup();
    database.close();
    await expect(service.list(session)).resolves.toEqual({ status: 'failed' });
    await expect(service.dismiss(session, 'x')).resolves.toEqual({
      status: 'failed',
    });
  });
});

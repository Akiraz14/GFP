import { CategoryManagementService } from '../../src/business/categories/categoryManagement';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import type { MovementInput } from '../../src/business/movements/movementRules';
import { readInteger } from '../../src/infrastructure/database/sqlDatabase';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

// 24/10/2026 al mediodía, hora local.
const NOW = new Date(2026, 9, 24, 12, 0, 0).getTime();

const LUNCH: MovementInput = {
  type: 'expense',
  amount: '45.500',
  date: '24/10/2026',
  categoryId: 'food',
  description: 'Almuerzo',
};

async function setup() {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  let clock = NOW;
  const now = () => clock++;
  const service = new MovementManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
    now,
  });
  const categories = new CategoryManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
    now,
  });
  const session = sessions.start(userId);
  return { database, userId, sessions, service, categories, session };
}

async function rows(database: Awaited<ReturnType<typeof setup>>['database']) {
  const result = await database.execute(
    'SELECT user_id, type, amount_cents, occurred_on, category_id, description FROM movements',
  );
  return result.rows;
}

describe('HU4-CA07: saving a movement', () => {
  test('stores the movement linked to the session user', async () => {
    const { database, service, session, userId } = await setup();
    const result = await service.create(session, LUNCH);
    expect(result).toMatchObject({
      status: 'saved',
      movement: {
        type: 'expense',
        amountCents: 4_550_000,
        occurredOn: '2026-10-24',
        categoryId: 'food',
        description: 'Almuerzo',
      },
    });
    expect(await rows(database)).toEqual([
      {
        user_id: userId,
        type: 'expense',
        amount_cents: 4_550_000,
        occurred_on: '2026-10-24',
        category_id: 'food',
        description: 'Almuerzo',
      },
    ]);
  });

  test('an empty description is stored as null (HU4-CA06)', async () => {
    const { database, service, session } = await setup();
    await service.create(session, { ...LUNCH, description: '   ' });
    expect((await rows(database))[0].description).toBeNull();
  });

  test('a new movement can be read back by its owner', async () => {
    const { service, session } = await setup();
    const saved = await service.create(session, LUNCH);
    if (saved.status !== 'saved') {
      throw new Error(saved.status);
    }
    await expect(service.get(session, saved.movement.id)).resolves.toEqual({
      status: 'ok',
      movement: saved.movement,
    });
    await expect(service.get(session, 'missing')).resolves.toEqual({
      status: 'not_found',
    });
  });
});

describe('HU4-CA01, CA04, CA05, CA13: invalid input writes nothing', () => {
  test.each<[string, Partial<MovementInput>, object]>([
    ['future date', { date: '25/10/2026' }, { date: 'future' }],
    ['zero amount', { amount: '0' }, { amount: 'invalid' }],
    ['text amount', { amount: 'abc' }, { amount: 'invalid' }],
    ['missing category', { categoryId: '' }, { categoryId: 'required' }],
    ['missing date', { date: '' }, { date: 'required' }],
  ])('%s', async (_name, overrides, errors) => {
    const { database, service, session } = await setup();
    await expect(
      service.create(session, { ...LUNCH, ...overrides }),
    ).resolves.toEqual({ status: 'invalid_input', errors });
    expect(await rows(database)).toEqual([]);
  });

  test('an income cannot use an expense category, but «Otros» is allowed (D-02, E06-D3)', async () => {
    const { database, service, session } = await setup();
    await expect(
      service.create(session, { ...LUNCH, type: 'income', categoryId: 'food' }),
    ).resolves.toEqual({
      status: 'invalid_input',
      errors: { categoryId: 'incompatible' },
    });
    await expect(
      service.create(session, {
        ...LUNCH,
        type: 'income',
        categoryId: 'other',
      }),
    ).resolves.toMatchObject({ status: 'saved' });
    await expect(
      service.create(session, {
        ...LUNCH,
        type: 'income',
        categoryId: 'salary',
      }),
    ).resolves.toMatchObject({ status: 'saved' });
    expect(await rows(database)).toHaveLength(2);
  });

  test('an unknown category is rejected', async () => {
    const { service, session } = await setup();
    await expect(
      service.create(session, { ...LUNCH, categoryId: 'missing' }),
    ).resolves.toEqual({
      status: 'invalid_input',
      errors: { categoryId: 'required' },
    });
  });
});

describe('HU4 editing (the entry point from HU5 arrives in E08)', () => {
  test('updates every field and keeps the creation date', async () => {
    const { service, session } = await setup();
    const saved = await service.create(session, LUNCH);
    if (saved.status !== 'saved') {
      throw new Error(saved.status);
    }
    const updated = await service.update(session, saved.movement.id, {
      type: 'income',
      amount: '1.250.000,50',
      date: '01/10/2026',
      categoryId: 'salary',
      description: '',
    });
    expect(updated).toMatchObject({
      status: 'saved',
      movement: {
        id: saved.movement.id,
        type: 'income',
        amountCents: 125_000_050,
        occurredOn: '2026-10-01',
        categoryId: 'salary',
        description: null,
        createdAt: saved.movement.createdAt,
      },
    });
    await expect(service.get(session, saved.movement.id)).resolves.toEqual({
      status: 'ok',
      movement: updated.status === 'saved' ? updated.movement : null,
    });
  });

  test('keeps the current category even if it no longer matches the type', async () => {
    const { service, categories, session } = await setup();
    const own = await categories.create(session, {
      name: 'Mascotas',
      type: 'expense',
      icon: 'pet',
    });
    if (own.status !== 'saved') {
      throw new Error(own.status);
    }
    const saved = await service.create(session, {
      ...LUNCH,
      categoryId: own.category.id,
    });
    if (saved.status !== 'saved') {
      throw new Error(saved.status);
    }
    await categories.update(session, own.category.id, {
      name: 'Mascotas',
      type: 'income',
      icon: 'pet',
    });
    await expect(
      service.update(session, saved.movement.id, {
        ...LUNCH,
        amount: '50000',
        categoryId: own.category.id,
      }),
    ).resolves.toMatchObject({ status: 'saved' });
    await expect(
      service.update(session, saved.movement.id, {
        ...LUNCH,
        categoryId: 'salary',
      }),
    ).resolves.toEqual({
      status: 'invalid_input',
      errors: { categoryId: 'incompatible' },
    });
  });

  test('invalid edits change nothing', async () => {
    const { database, service, session } = await setup();
    const saved = await service.create(session, LUNCH);
    if (saved.status !== 'saved') {
      throw new Error(saved.status);
    }
    await expect(
      service.update(session, saved.movement.id, { ...LUNCH, amount: '-1' }),
    ).resolves.toEqual({
      status: 'invalid_input',
      errors: { amount: 'invalid' },
    });
    expect((await rows(database))[0].amount_cents).toBe(4_550_000);
  });

  test('an unknown movement is not found', async () => {
    const { service, session } = await setup();
    await expect(service.update(session, 'missing', LUNCH)).resolves.toEqual({
      status: 'not_found',
    });
  });
});

describe('isolation per user (HU2-CA11) and session required (HU2-CA10)', () => {
  test('another user cannot read, edit or use the categories of the owner', async () => {
    const { database, sessions, service, categories, session } = await setup();
    const own = await categories.create(session, {
      name: 'Mascotas',
      type: 'expense',
      icon: 'pet',
    });
    const saved = await service.create(session, LUNCH);
    if (saved.status !== 'saved' || own.status !== 'saved') {
      throw new Error('setup failed');
    }
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
    await expect(service.get(other, saved.movement.id)).resolves.toEqual({
      status: 'not_found',
    });
    await expect(
      service.update(other, saved.movement.id, LUNCH),
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      service.create(other, { ...LUNCH, categoryId: own.category.id }),
    ).resolves.toEqual({
      status: 'invalid_input',
      errors: { categoryId: 'required' },
    });
    expect((await rows(database))[0].description).toBe('Almuerzo');
  });

  test('every operation answers session_expired after logging out', async () => {
    const { database, service, sessions, session } = await setup();
    const saved = await service.create(session, LUNCH);
    if (saved.status !== 'saved') {
      throw new Error(saved.status);
    }
    sessions.end();
    await expect(service.get(session, saved.movement.id)).resolves.toEqual({
      status: 'session_expired',
    });
    await expect(service.create(session, LUNCH)).resolves.toEqual({
      status: 'session_expired',
    });
    await expect(
      service.update(session, saved.movement.id, { ...LUNCH, amount: '1' }),
    ).resolves.toEqual({ status: 'session_expired' });
    const total = await database.execute(
      'SELECT count(*) AS total, max(amount_cents) AS amount FROM movements',
    );
    expect(readInteger(total.rows[0], 'total')).toBe(1);
    expect(readInteger(total.rows[0], 'amount')).toBe(4_550_000);
  });

  test('a database failure is reported without details', async () => {
    const { database, service, session } = await setup();
    database.close();
    await expect(service.create(session, LUNCH)).resolves.toEqual({
      status: 'failed',
    });
    await expect(service.get(session, 'any')).resolves.toEqual({
      status: 'failed',
    });
  });
});

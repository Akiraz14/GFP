import { CategoryManagementService } from '../../src/business/categories/categoryManagement';
import { readInteger } from '../../src/infrastructure/database/sqlDatabase';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const PETS = { name: 'Mascotas', type: 'expense', icon: 'pet' };

async function setup() {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  let clock = 1000;
  const service = new CategoryManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
    now: () => clock++,
  });
  const session = sessions.start(userId);
  return { database, userId, sessions, service, session };
}

async function created(
  service: CategoryManagementService,
  session: Awaited<ReturnType<typeof setup>>['session'],
  input = PETS,
) {
  const result = await service.create(session, input);
  if (result.status !== 'saved') {
    throw new Error(`category not created: ${result.status}`);
  }
  return result.category;
}

async function names(
  service: CategoryManagementService,
  session: Awaited<ReturnType<typeof setup>>['session'],
) {
  const result = await service.listActiveCategories(session);
  if (result.status !== 'ok') {
    throw new Error(result.status);
  }
  return result.categories.map(category => category.name);
}

describe('HU8 list of categories', () => {
  test('HU8-CA01: a new user sees the 9 system categories', async () => {
    const { service, session } = await setup();
    const result = await service.listActiveCategories(session);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.categories).toHaveLength(9);
      expect(result.categories.every(category => category.isSystem)).toBe(true);
    }
  });

  test('lists system categories first and own ones by creation order (E06-D9)', async () => {
    const { service, session } = await setup();
    await created(service, session, PETS);
    await created(service, session, {
      name: 'Freelance',
      type: 'income',
      icon: 'briefcase',
    });
    await created(service, session, {
      name: 'Gimnasio',
      type: 'expense',
      icon: 'dumbbell',
    });
    const all = await names(service, session);
    expect(all.slice(0, 9)).toEqual([
      'Alimentación',
      'Transporte',
      'Vivienda',
      'Entretenimiento',
      'Salud',
      'Educación',
      'Compras',
      'Salario',
      'Otros',
    ]);
    expect(all.slice(9)).toEqual(['Mascotas', 'Freelance', 'Gimnasio']);
  });

  test('filters by type for the HU4 selector', async () => {
    const { service, session } = await setup();
    await created(service, session, {
      name: 'Freelance',
      type: 'income',
      icon: 'briefcase',
    });
    const income = await service.listActiveCategories(session, 'income');
    expect(
      income.status === 'ok' && income.categories.map(c => c.name),
    ).toEqual(['Salario', 'Freelance']);
  });

  test('HU8-CA08: a created or edited category appears in the next query', async () => {
    const { service, session } = await setup();
    const pets = await created(service, session);
    expect(await names(service, session)).toContain('Mascotas');
    await service.update(session, pets.id, { ...PETS, name: 'Mascotas y vet' });
    const after = await names(service, session);
    expect(after).toContain('Mascotas y vet');
    expect(after).not.toContain('Mascotas');
  });
});

describe('HU8-CA03: create custom categories', () => {
  test('creates a category with name, type and icon owned by the session user', async () => {
    const { database, userId, service, session } = await setup();
    const result = await service.create(session, {
      name: '  Mascotas ',
      type: 'expense',
      icon: 'pet',
    });
    expect(result).toMatchObject({
      status: 'saved',
      category: {
        name: 'Mascotas',
        type: 'expense',
        icon: 'pet',
        isSystem: false,
      },
    });
    const stored = await database.execute(
      'SELECT user_id, name_normalized FROM categories WHERE is_system = 0',
    );
    expect(stored.rows).toEqual([
      { user_id: userId, name_normalized: 'mascotas' },
    ]);
  });

  test('returns field errors and writes nothing for invalid input', async () => {
    const { database, service, session } = await setup();
    await expect(
      service.create(session, { name: ' ', type: 'saving', icon: 'rocket' }),
    ).resolves.toEqual({
      status: 'invalid_input',
      errors: { name: 'required', type: 'invalid', icon: 'invalid' },
    });
    const total = await database.execute(
      'SELECT count(*) AS total FROM categories WHERE is_system = 0',
    );
    expect(readInteger(total.rows[0], 'total')).toBe(0);
  });
});

describe('HU8-CA04: duplicate names', () => {
  test.each([
    ['a system name in lower case', 'alimentación'],
    ['a system name in upper case', 'OTROS'],
    ['an own name with other case', 'MASCOTAS'],
    ['an own name with extra spaces', '  mascotas  '],
  ])('rejects %s', async (_label, name) => {
    const { service, session } = await setup();
    await created(service, session);
    await expect(service.create(session, { ...PETS, name })).resolves.toEqual({
      status: 'duplicate_name',
    });
  });

  test('rejects renaming a category to an existing name', async () => {
    const { service, session } = await setup();
    await created(service, session);
    const gym = await created(service, session, {
      name: 'Gimnasio',
      type: 'expense',
      icon: 'dumbbell',
    });
    await expect(
      service.update(session, gym.id, { ...PETS, name: 'mascotas' }),
    ).resolves.toEqual({ status: 'duplicate_name' });
    await expect(
      service.update(session, gym.id, { ...PETS, name: 'Salud' }),
    ).resolves.toEqual({ status: 'duplicate_name' });
  });

  test('allows changing only the case of the own name', async () => {
    const { service, session } = await setup();
    const pets = await created(service, session);
    await expect(
      service.update(session, pets.id, { ...PETS, name: 'MASCOTAS' }),
    ).resolves.toMatchObject({
      status: 'saved',
      category: { name: 'MASCOTAS' },
    });
  });

  test('checkName reports taken and available names while typing', async () => {
    const { service, session } = await setup();
    const pets = await created(service, session);
    await expect(service.checkName(session, 'alimentación')).resolves.toEqual({
      status: 'taken',
    });
    await expect(service.checkName(session, 'Viajes')).resolves.toEqual({
      status: 'available',
    });
    await expect(
      service.checkName(session, 'mascotas', pets.id),
    ).resolves.toEqual({ status: 'available' });
  });
});

describe('HU8-CA05: reusable icons', () => {
  test('several categories may use the same icon, including a system one', async () => {
    const { service, session } = await setup();
    await created(service, session, { ...PETS, icon: 'food' });
    await created(service, session, {
      name: 'Veterinaria',
      type: 'expense',
      icon: 'food',
    });
    const result = await service.listActiveCategories(session);
    expect(
      result.status === 'ok' &&
        result.categories.filter(category => category.icon === 'food'),
    ).toHaveLength(3);
  });
});

describe('HU8-CA02 and HU8-CA06: editing', () => {
  test('edits the name, type and icon of an own category', async () => {
    const { service, session } = await setup();
    const pets = await created(service, session);
    const result = await service.update(session, pets.id, {
      name: 'Ventas',
      type: 'income',
      icon: 'cart',
    });
    expect(result).toMatchObject({
      status: 'saved',
      category: { id: pets.id, name: 'Ventas', type: 'income', icon: 'cart' },
    });
  });

  test('system categories cannot be edited', async () => {
    const { service, session } = await setup();
    await expect(
      service.update(session, 'food', {
        name: 'Comida',
        type: 'expense',
        icon: 'food',
      }),
    ).resolves.toEqual({ status: 'protected' });
    expect(await names(service, session)).toContain('Alimentación');
  });

  test('an unknown category is not found', async () => {
    const { service, session } = await setup();
    await expect(service.update(session, 'missing', PETS)).resolves.toEqual({
      status: 'not_found',
    });
  });
});

describe('HU8-CA07a: deleting', () => {
  test('deletes an own category', async () => {
    const { service, session } = await setup();
    const pets = await created(service, session);
    await expect(service.remove(session, pets.id)).resolves.toEqual({
      status: 'deleted',
    });
    expect(await names(service, session)).not.toContain('Mascotas');
  });

  test('system categories cannot be deleted', async () => {
    const { service, session } = await setup();
    for (const id of ['food', 'salary', 'other']) {
      await expect(service.remove(session, id)).resolves.toEqual({
        status: 'protected',
      });
    }
    expect(await names(service, session)).toHaveLength(9);
  });

  test('a deleted name can be used again', async () => {
    const { service, session } = await setup();
    const pets = await created(service, session);
    await service.remove(session, pets.id);
    await expect(service.create(session, PETS)).resolves.toMatchObject({
      status: 'saved',
    });
  });
});

describe('session required (HU2-CA10)', () => {
  test('every operation answers session_expired after logging out', async () => {
    const { database, service, sessions, session } = await setup();
    const pets = await created(service, session);
    sessions.end();
    await expect(service.listActiveCategories(session)).resolves.toEqual({
      status: 'session_expired',
    });
    await expect(service.checkName(session, 'Viajes')).resolves.toEqual({
      status: 'session_expired',
    });
    await expect(
      service.create(session, { ...PETS, name: 'Viajes' }),
    ).resolves.toEqual({ status: 'session_expired' });
    await expect(service.update(session, pets.id, PETS)).resolves.toEqual({
      status: 'session_expired',
    });
    await expect(service.remove(session, pets.id)).resolves.toEqual({
      status: 'session_expired',
    });
    const total = await database.execute(
      'SELECT count(*) AS total FROM categories WHERE is_system = 0',
    );
    expect(readInteger(total.rows[0], 'total')).toBe(1);
  });

  test('a database failure is reported without details', async () => {
    const { database, service, session } = await setup();
    database.close();
    await expect(service.create(session, PETS)).resolves.toEqual({
      status: 'failed',
    });
    await expect(service.listActiveCategories(session)).resolves.toEqual({
      status: 'failed',
    });
  });
});

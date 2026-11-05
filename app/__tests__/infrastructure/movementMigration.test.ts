import { MIGRATIONS } from '../../src/infrastructure/database/migrations';
import {
  migrateDatabase,
  migrationChecksum,
} from '../../src/infrastructure/database/migrator';
import type {
  SqlDatabase,
  SqlValue,
} from '../../src/infrastructure/database/sqlDatabase';
import { createNodeSqliteDatabase } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

async function insert(
  database: SqlDatabase,
  userId: string,
  overrides: Record<string, SqlValue> = {},
) {
  const row: Record<string, SqlValue> = {
    id: `m-${Math.random().toString(16).slice(2)}`,
    type: 'expense',
    amount_cents: 100,
    occurred_on: '2026-10-24',
    category_id: 'food',
    description: null,
    ...overrides,
  };
  await database.execute(
    `INSERT INTO movements (id, user_id, type, amount_cents, occurred_on, category_id,
       description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
    [
      row.id,
      userId,
      row.type,
      row.amount_cents,
      row.occurred_on,
      row.category_id,
      row.description,
    ],
  );
  return row.id as string;
}

async function secondUser(database: SqlDatabase) {
  return createAccount(
    database,
    profile({
      documentNumber: '2002',
      email: 'luis@example.com',
      phoneNumber: '3002223344',
    }),
  );
}

describe('migration 5: movements (HU4)', () => {
  test('keeps migration 4 identical to the published version', () => {
    expect(migrationChecksum(MIGRATIONS[3])).toBe(
      '79ceb0f8178203f7904811a32fff7c6d5c610a7c2dee0c3bd5a16dce3dba0776',
    );
  });

  test('upgrades a version 4 database with users and categories', async () => {
    const database = createNodeSqliteDatabase();
    await migrateDatabase(database, () => 1, MIGRATIONS.slice(0, 4));
    const userId = await createAccount(database, profile());
    await expect(migrateDatabase(database, () => 2)).resolves.toBe(6);
    await insert(database, userId);
    const total = await database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(total.rows[0]).toEqual({ total: 1 });
  });

  test.each<[string, Record<string, SqlValue>]>([
    ['an unknown type', { type: 'transfer' }],
    ['a zero amount', { amount_cents: 0 }],
    ['a negative amount', { amount_cents: -5 }],
    ['an amount over the maximum', { amount_cents: 100_000_000_000_000 }],
    ['an amount with decimals', { amount_cents: 1.5 }],
    ['a date with time', { occurred_on: '2026-10-24 10:00' }],
    ['an impossible date', { occurred_on: '2026-02-30' }],
    ['a date in another format', { occurred_on: '24/10/2026' }],
    ['an empty description', { description: '' }],
    ['a description over 250 characters', { description: 'x'.repeat(251) }],
    ['an unknown category', { category_id: 'missing' }],
  ])('rejects %s', async (_name, overrides) => {
    const database = await createMigratedDatabase();
    const userId = await createAccount(database, profile());
    await expect(insert(database, userId, overrides)).rejects.toThrow();
  });

  test('accepts 250 characters of description', async () => {
    const database = await createMigratedDatabase();
    const userId = await createAccount(database, profile());
    await expect(
      insert(database, userId, { description: 'ñ'.repeat(250) }),
    ).resolves.toBeDefined();
  });

  test('a movement cannot use the custom category of another user', async () => {
    const database = await createMigratedDatabase();
    const owner = await createAccount(database, profile());
    const other = await secondUser(database);
    await database.execute(
      `INSERT INTO categories (id, user_id, name, name_normalized, type, icon, is_system,
         created_at, updated_at)
       VALUES ('own', ?, 'Mascotas', 'mascotas', 'expense', 'pet', 0, 1, 1)`,
      [owner],
    );
    await expect(
      insert(database, other, { category_id: 'own' }),
    ).rejects.toThrow(/movement_category_not_accessible/);
    const id = await insert(database, other);
    await expect(
      database.execute(
        "UPDATE movements SET category_id = 'own' WHERE id = ?",
        [id],
      ),
    ).rejects.toThrow(/movement_category_not_accessible/);
    await expect(
      insert(database, owner, { category_id: 'own' }),
    ).resolves.toBeDefined();
  });

  test('the owner of a movement cannot change', async () => {
    const database = await createMigratedDatabase();
    const owner = await createAccount(database, profile());
    const other = await secondUser(database);
    const id = await insert(database, owner);
    await expect(
      database.execute('UPDATE movements SET user_id = ? WHERE id = ?', [
        other,
        id,
      ]),
    ).rejects.toThrow(/movement_owner_immutable/);
  });

  test('deleting a user deletes their movements', async () => {
    const database = await createMigratedDatabase();
    const owner = await createAccount(database, profile());
    await insert(database, owner);
    await database.execute('DELETE FROM users WHERE id = ?', [owner]);
    const total = await database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(total.rows[0]).toEqual({ total: 0 });
  });
});

// Migración 5 publicada en `main` (etapa-07-aprobada).
const MIGRATION_5_CHECKSUM =
  '8b0a11f06a1ff5b1c0977b9c78b29b316d8a996001408efbaf9d0f6363493171';

describe('migration 6: recommendation dismissals (HU10, I-27)', () => {
  test('keeps migration 5 identical to the published version', () => {
    expect(migrationChecksum(MIGRATIONS[4])).toBe(MIGRATION_5_CHECKSUM);
  });

  test('upgrades a version 5 database with movements', async () => {
    const database = createNodeSqliteDatabase();
    await migrateDatabase(database, () => 1, MIGRATIONS.slice(0, 5));
    const userId = await createAccount(database, profile());
    const id = await insert(database, userId);
    await expect(migrateDatabase(database, () => 2)).resolves.toBe(6);
    const kept = await database.execute(
      'SELECT count(*) AS total FROM movements WHERE id = ?',
      [id],
    );
    expect(kept.rows[0]).toEqual({ total: 1 });
    await database.execute(
      `INSERT INTO recommendation_dismissals VALUES (?, 'negative-balance', '2026-11', 1)`,
      [userId],
    );
    await expect(
      database.execute(
        `INSERT INTO recommendation_dismissals VALUES (?, 'negative-balance', '2026-11-04', 1)`,
        [userId],
      ),
    ).rejects.toThrow();
    await database.execute('DELETE FROM users WHERE id = ?', [userId]);
    const left = await database.execute(
      'SELECT count(*) AS total FROM recommendation_dismissals',
    );
    expect(left.rows[0]).toEqual({ total: 0 });
  });
});

import {
  CATEGORY_ICON_IDS,
  OTHER_CATEGORY_ID,
  SYSTEM_CATEGORIES,
} from '../../src/infrastructure/database/categoryCatalogs';
import { MIGRATIONS } from '../../src/infrastructure/database/migrations';
import {
  migrateDatabase,
  migrationChecksum,
} from '../../src/infrastructure/database/migrator';
import {
  readInteger,
  type SqlDatabase,
} from '../../src/infrastructure/database/sqlDatabase';
import { randomUuid } from '../../src/infrastructure/security/secureRandom';
import {
  createNodeSqliteDatabase,
  nodeRandomBytes,
} from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

async function insertCustom(
  database: SqlDatabase,
  userId: string,
  name: string,
  nameNormalized = name.toLocaleLowerCase('es-CO'),
): Promise<string> {
  const id = randomUuid(nodeRandomBytes);
  await database.execute(
    `INSERT INTO categories (id, user_id, is_system, name, name_normalized, type, icon,
       created_at, updated_at) VALUES (?, ?, 0, ?, ?, 'expense', 'pet', 1, 1)`,
    [id, userId, name, nameNormalized],
  );
  return id;
}

async function count(database: SqlDatabase, where = '1 = 1') {
  const result = await database.execute(
    `SELECT count(*) AS total FROM categories WHERE ${where}`,
  );
  return readInteger(result.rows[0], 'total');
}

describe('HU8-CA01: system categories seeding (migration 4)', () => {
  test('creates the 9 system categories in the literal order of HU8-CA01', async () => {
    const database = await createMigratedDatabase();
    const rows = await database.execute(
      `SELECT id, user_id, is_system, name, type, icon FROM categories
        ORDER BY sort_order`,
    );
    expect(rows.rows.map(row => row.name)).toEqual([
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
    expect(rows.rows.every(row => row.is_system === 1)).toBe(true);
    expect(rows.rows.every(row => row.user_id === null)).toBe(true);
  });

  test('uses the prototype types: only Salario is income (E06-D2)', async () => {
    const database = await createMigratedDatabase();
    const income = await database.execute(
      "SELECT name FROM categories WHERE type = 'income'",
    );
    expect(income.rows).toEqual([{ name: 'Salario' }]);
    expect(await count(database, "type = 'expense'")).toBe(8);
  });

  test('exposes a fixed id for «Otros» (HU8-CA07c)', async () => {
    const database = await createMigratedDatabase();
    const other = await database.execute(
      'SELECT name, type FROM categories WHERE id = ?',
      [OTHER_CATEGORY_ID],
    );
    expect(other.rows).toEqual([{ name: 'Otros', type: 'expense' }]);
  });

  test('every system category uses an icon from the catalog (E06-D5)', () => {
    for (const category of SYSTEM_CATEGORIES) {
      expect(CATEGORY_ICON_IDS).toContain(category.icon);
    }
    expect(new Set(CATEGORY_ICON_IDS).size).toBe(CATEGORY_ICON_IDS.length);
  });

  test('stores a case-insensitive key for every system name (E06-D9)', () => {
    for (const category of SYSTEM_CATEGORIES) {
      expect(category.nameNormalized).toBe(
        category.name.normalize('NFC').toLocaleLowerCase('es-CO'),
      );
    }
  });

  test('runs only once: reopening the database does not duplicate the seed', async () => {
    const database = await createMigratedDatabase();
    await migrateDatabase(database, () => 2);
    await migrateDatabase(database, () => 3);
    expect(await count(database)).toBe(9);
  });

  test('upgrades a version 3 database with users and keeps their data', async () => {
    const database = createNodeSqliteDatabase();
    await migrateDatabase(database, () => 1, MIGRATIONS.slice(0, 3));
    const userId = await createAccount(database, profile());
    await expect(migrateDatabase(database, () => 2)).resolves.toBe(4);
    expect(await count(database, 'is_system = 1')).toBe(9);
    const users = await database.execute('SELECT id FROM users');
    expect(users.rows).toEqual([{ id: userId }]);
  });

  test('keeps migrations 1 to 3 identical to the published versions', () => {
    expect(MIGRATIONS.slice(0, 3).map(migrationChecksum)).toEqual([
      'f9e89526183f63ee48fb56bf984a55433b783a0a5e020cefbd27c9604b554b12',
      'e2ac5c96997edcf2df08e603656920d0fe4d3eb812a050247796a9aa4ea87791',
      '9b52b070d712be0a15a3ad08bb06d459967debbc6a4f58607c47d09ec02758f0',
    ]);
  });
});

describe('HU8-CA02 and HU8-CA07a: system categories are protected in the database', () => {
  test('cannot be edited, even with direct SQL', async () => {
    const database = await createMigratedDatabase();
    for (const statement of [
      "UPDATE categories SET name = 'Comida' WHERE id = 'food'",
      "UPDATE categories SET type = 'income' WHERE id = 'other'",
      "UPDATE categories SET icon = 'pet' WHERE id = 'salary'",
    ]) {
      await expect(database.execute(statement)).rejects.toThrow(
        /system_category_protected/,
      );
    }
    const food = await database.execute(
      "SELECT name FROM categories WHERE id = 'food'",
    );
    expect(food.rows).toEqual([{ name: 'Alimentación' }]);
  });

  test('cannot be deleted, even with direct SQL', async () => {
    const database = await createMigratedDatabase();
    await expect(
      database.execute("DELETE FROM categories WHERE id = 'other'"),
    ).rejects.toThrow(/system_category_protected/);
    await expect(database.execute('DELETE FROM categories')).rejects.toThrow(
      /system_category_protected/,
    );
    expect(await count(database, 'is_system = 1')).toBe(9);
  });

  test('no new system category can be added after the seed', async () => {
    const database = await createMigratedDatabase();
    await expect(
      database.execute(
        `INSERT INTO categories (id, user_id, is_system, name, name_normalized, type, icon,
           created_at, updated_at) VALUES ('extra', NULL, 1, 'Extra', 'extra', 'expense',
           'more', 1, 1)`,
      ),
    ).rejects.toThrow(/system_category_protected/);
  });

  test('a custom category cannot be turned into a system one or change owner', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(database, profile());
    const luis = await createAccount(
      database,
      profile({
        documentNumber: '2002',
        email: 'luis@example.com',
        phoneNumber: '3004445566',
      }),
    );
    const id = await insertCustom(database, ana, 'Mascotas');
    await expect(
      database.execute(
        'UPDATE categories SET is_system = 1, user_id = NULL WHERE id = ?',
        [id],
      ),
    ).rejects.toThrow(/category_owner_immutable/);
    await expect(
      database.execute('UPDATE categories SET user_id = ? WHERE id = ?', [
        luis,
        id,
      ]),
    ).rejects.toThrow(/category_owner_immutable/);
  });
});

describe('HU8-CA04: duplicate names in the database (E06-D1)', () => {
  test('a custom category cannot repeat a system name', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(database, profile());
    await expect(
      insertCustom(database, ana, 'ALIMENTACIÓN', 'alimentación'),
    ).rejects.toThrow(/category_name_taken/);
    const id = await insertCustom(database, ana, 'Mascotas');
    await expect(
      database.execute(
        "UPDATE categories SET name = 'Otros', name_normalized = 'otros' WHERE id = ?",
        [id],
      ),
    ).rejects.toThrow(/category_name_taken/);
  });

  test('a user cannot have two categories with the same key', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(database, profile());
    await insertCustom(database, ana, 'Mascotas', 'mascotas');
    await expect(
      insertCustom(database, ana, 'MASCOTAS', 'mascotas'),
    ).rejects.toThrow(/UNIQUE/);
  });

  test('two users may each have their own category with the same name', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(database, profile());
    const luis = await createAccount(
      database,
      profile({
        documentNumber: '2002',
        email: 'luis@example.com',
        phoneNumber: '3004445566',
      }),
    );
    await insertCustom(database, ana, 'Mascotas');
    await insertCustom(database, luis, 'Mascotas');
    expect(await count(database, "name_normalized = 'mascotas'")).toBe(2);
  });
});

describe('HU8-CA05 and ownership rules', () => {
  test('several categories may share the same icon', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(database, profile());
    await insertCustom(database, ana, 'Mascotas');
    await insertCustom(database, ana, 'Veterinaria');
    expect(await count(database, "icon = 'pet'")).toBe(2);
  });

  test('custom categories require an owner and system ones forbid it', async () => {
    const database = await createMigratedDatabase();
    await expect(
      database.execute(
        `INSERT INTO categories (id, user_id, is_system, name, name_normalized, type, icon,
           created_at, updated_at) VALUES ('orphan', NULL, 0, 'Sin dueño', 'sin dueño',
           'expense', 'pet', 1, 1)`,
      ),
    ).rejects.toThrow(/CHECK/);
  });

  test('rejects unknown types and empty names', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(database, profile());
    await expect(
      database.execute(
        `INSERT INTO categories (id, user_id, is_system, name, name_normalized, type, icon,
           created_at, updated_at) VALUES ('t1', ?, 0, 'Ahorro', 'ahorro', 'saving',
           'pet', 1, 1)`,
        [ana],
      ),
    ).rejects.toThrow(/CHECK/);
    await expect(insertCustom(database, ana, '', '')).rejects.toThrow(/CHECK/);
  });

  test('deleting a user removes only their custom categories', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(database, profile());
    await insertCustom(database, ana, 'Mascotas');
    await database.execute('DELETE FROM users WHERE id = ?', [ana]);
    expect(await count(database, 'is_system = 0')).toBe(0);
    expect(await count(database, 'is_system = 1')).toBe(9);
  });
});

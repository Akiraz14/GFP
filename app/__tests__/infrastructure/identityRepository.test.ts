import {
  AccountAlreadyRegisteredError,
  IdentityRepository,
  InactiveDocumentTypeError,
} from '../../src/infrastructure/database/repositories/identityRepository';
import {
  readInteger,
  type SqlDatabase,
} from '../../src/infrastructure/database/sqlDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

async function countUsers(database: SqlDatabase): Promise<number> {
  const result = await database.execute('SELECT count(*) AS total FROM users');
  return readInteger(result.rows[0], 'total');
}

async function rawInsert(
  database: SqlDatabase,
  overrides: Record<string, string | null> = {},
): Promise<void> {
  const row: Record<string, string | null> = {
    id: '00000000-0000-4000-8000-000000000099',
    document_type_code: 'CC',
    document_number: '9999',
    document_number_normalized: '9999',
    first_name: 'Prueba',
    last_name: 'Directa',
    phone_country_code: '+57',
    phone_number: '3200000000',
    phone_e164: '+573200000000',
    email: 'directa@example.com',
    email_normalized: 'directa@example.com',
    ...overrides,
  };
  const columns = Object.keys(row);
  await database.execute(
    `INSERT INTO users (${columns.join(', ')}, created_at, updated_at)
     VALUES (${columns.map(() => '?').join(', ')}, 1, 1)`,
    Object.values(row),
  );
}

describe('document numbers (A-ID3)', () => {
  test('keeps the original value and compares the normalized one', async () => {
    const database = await createMigratedDatabase();
    await createAccount(
      database,
      profile({ documentNumber: ' 1.020.304-050 ' }),
    );
    const stored = await database.execute(
      'SELECT document_number, document_number_normalized FROM users',
    );
    expect(stored.rows).toEqual([
      {
        document_number: '1.020.304-050',
        document_number_normalized: '1020304050',
      },
    ]);
    await expect(
      createAccount(
        database,
        profile({
          documentNumber: '1020304050',
          email: 'otra@example.com',
          phoneNumber: '3009999999',
        }),
      ),
    ).rejects.toBeInstanceOf(AccountAlreadyRegisteredError);
  });

  test('passports compare in upper case and leading zeros are kept', async () => {
    const database = await createMigratedDatabase();
    await createAccount(
      database,
      profile({ documentTypeCode: 'PA', documentNumber: 'ab123456' }),
    );
    await expect(
      createAccount(
        database,
        profile({
          documentTypeCode: 'PA',
          documentNumber: 'AB 123456',
          email: 'b@example.com',
          phoneNumber: '3009999999',
        }),
      ),
    ).rejects.toBeInstanceOf(AccountAlreadyRegisteredError);
    await createAccount(
      database,
      profile({
        documentNumber: '0012345',
        email: 'c@example.com',
        phoneNumber: '3008888888',
      }),
    );
    await createAccount(
      database,
      profile({
        documentNumber: '12345',
        email: 'd@example.com',
        phoneNumber: '3007777777',
      }),
    );
    expect(await countUsers(database)).toBe(3);
  });
});

describe('mandatory phone in E.164 (A-ID2, A-ID4)', () => {
  test('stores the country code, the national number and the canonical phone', async () => {
    const database = await createMigratedDatabase();
    await createAccount(database, profile({ phoneNumber: '(300) 111-2233' }));
    const stored = await database.execute(
      'SELECT phone_country_code, phone_number, phone_e164 FROM users',
    );
    expect(stored.rows).toEqual([
      {
        phone_country_code: '+57',
        phone_number: '3001112233',
        phone_e164: '+573001112233',
      },
    ]);
  });

  test.each([
    ['without country code', { phone_country_code: null }],
    ['without national number', { phone_number: null }],
    ['without canonical phone', { phone_e164: null }],
    ['with an inconsistent canonical phone', { phone_e164: '+573200000001' }],
    ['with letters in the national number', { phone_number: '32000000x0' }],
    ['with a malformed country code', { phone_country_code: '57' }],
  ])('the schema rejects a user %s', async (_label, overrides) => {
    const database = await createMigratedDatabase();
    await expect(rawInsert(database, overrides)).rejects.toThrow();
    expect(await countUsers(database)).toBe(0);
  });
});

describe('unambiguous identifiers between accounts (A-ID1)', () => {
  test('rejects a document equal to the phone of another account', async () => {
    const database = await createMigratedDatabase();
    await createAccount(database, profile());
    await expect(
      createAccount(
        database,
        profile({
          documentNumber: '3001112233',
          email: 'b@example.com',
          phoneNumber: '3009999999',
        }),
      ),
    ).rejects.toBeInstanceOf(AccountAlreadyRegisteredError);
    expect(await countUsers(database)).toBe(1);
  });

  test('rejects a phone equal to the document of another account', async () => {
    const database = await createMigratedDatabase();
    await createAccount(database, profile({ documentNumber: '3205556677' }));
    await expect(
      createAccount(
        database,
        profile({
          documentNumber: '2002',
          email: 'b@example.com',
          phoneCountryCode: '+1',
          phoneNumber: '320 555 6677',
        }),
      ),
    ).rejects.toBeInstanceOf(AccountAlreadyRegisteredError);
    expect(await countUsers(database)).toBe(1);
  });

  test('allows the document of an account to match its own phone', async () => {
    const database = await createMigratedDatabase();
    await createAccount(database, profile({ documentNumber: '3001112233' }));
    expect(await countUsers(database)).toBe(1);
  });

  test('the database enforces the rule even without the repository checks', async () => {
    const database = await createMigratedDatabase();
    await createAccount(database, profile());
    await expect(
      rawInsert(database, {
        document_number: '3001112233',
        document_number_normalized: '3001112233',
      }),
    ).rejects.toThrow(/identifier_collision/);
    await expect(
      rawInsert(database, {
        phone_number: '1001',
        phone_e164: '+571001',
      }),
    ).rejects.toThrow(/identifier_collision/);
    await expect(
      rawInsert(database, { email_normalized: 'ana@example.com' }),
    ).rejects.toThrow(/UNIQUE/);
    await expect(
      rawInsert(database, {
        phone_number: '3001112233',
        phone_e164: '+573001112233',
      }),
    ).rejects.toThrow(/UNIQUE/);
    expect(await countUsers(database)).toBe(1);
  });
});

describe('login identifiers (A-ID2)', () => {
  test('resolves email, document, national and canonical phone', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(
      database,
      profile({ documentNumber: '1.001' }),
    );
    const repository = new IdentityRepository(database);
    for (const identifier of [
      ' ANA@example.com',
      '1001',
      '1.001',
      '300 111 2233',
      '+57 300-111-2233',
    ]) {
      await expect(repository.lookupIdentifier(identifier)).resolves.toEqual({
        status: 'found',
        userId: ana,
      });
    }
    await expect(
      repository.lookupIdentifier('+52 3001112233'),
    ).resolves.toEqual({ status: 'not_found' });
  });

  test('asks for the country code when the national number is ambiguous', async () => {
    const database = await createMigratedDatabase();
    const ana = await createAccount(database, profile());
    await createAccount(
      database,
      profile({
        documentNumber: '2002',
        email: 'b@example.com',
        phoneCountryCode: '+52',
      }),
    );
    const repository = new IdentityRepository(database);
    await expect(repository.lookupIdentifier('3001112233')).resolves.toEqual({
      status: 'phone_country_code_required',
    });
    await expect(repository.lookupIdentifier('+573001112233')).resolves.toEqual(
      { status: 'found', userId: ana },
    );
  });
});

describe('active document types (E03-D4, E03-V11)', () => {
  test('lists only CC, CE, PA and PPT; NIT stays in the catalog as inactive', async () => {
    const database = await createMigratedDatabase();
    const repository = new IdentityRepository(database);
    await expect(repository.listActiveDocumentTypes()).resolves.toEqual([
      { code: 'CC', name: 'Cédula de ciudadanía' },
      { code: 'CE', name: 'Cédula de extranjería' },
      { code: 'PA', name: 'Pasaporte' },
      { code: 'PPT', name: 'Permiso por protección temporal' },
    ]);
    const nit = await database.execute(
      "SELECT is_active FROM document_types WHERE code = 'NIT'",
    );
    expect(nit.rows).toEqual([{ is_active: 0 }]);
  });

  test('registration rejects an inactive or unknown type', async () => {
    const database = await createMigratedDatabase();
    for (const documentTypeCode of ['NIT', 'TI']) {
      await expect(
        createAccount(database, profile({ documentTypeCode })),
      ).rejects.toBeInstanceOf(InactiveDocumentTypeError);
    }
    expect(await countUsers(database)).toBe(0);
  });

  test('the database rejects an inactive type even without the repository check', async () => {
    const database = await createMigratedDatabase();
    await expect(
      rawInsert(database, { document_type_code: 'NIT' }),
    ).rejects.toThrow(/inactive_document_type/);
    await rawInsert(database);
    await expect(
      database.execute(
        "UPDATE users SET document_type_code = 'NIT' WHERE document_number = '9999'",
      ),
    ).rejects.toThrow(/inactive_document_type/);
  });
});

describe('atomic account creation', () => {
  test('a failure after inserting the user leaves no partial account', async () => {
    const database = await createMigratedDatabase();
    await expect(
      createAccount(database, profile(), 'Clave123!', [
        { questionId: 'favorite-color', answer: 'Azul' },
        { questionId: 'not-a-question', answer: 'Algo' },
      ]),
    ).rejects.toThrow();
    expect(await countUsers(database)).toBe(0);
    const credentials = await database.execute(
      'SELECT count(*) AS total FROM credentials',
    );
    expect(readInteger(credentials.rows[0], 'total')).toBe(0);
  });

  test('simultaneous registrations with the same email create one account', async () => {
    const database = await createMigratedDatabase();
    const results = await Promise.allSettled([
      createAccount(database, profile()),
      createAccount(
        database,
        profile({ documentNumber: '2002', phoneNumber: '3009999999' }),
      ),
    ]);
    expect(results.map(result => result.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    const rejected = results.find(result => result.status === 'rejected');
    expect((rejected as PromiseRejectedResult).reason).toBeInstanceOf(
      AccountAlreadyRegisteredError,
    );
    expect(await countUsers(database)).toBe(1);
  });
});

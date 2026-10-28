import { IdentityRepository } from '../../../src/infrastructure/database/repositories/identityRepository';
import {
  readInteger,
  type SqlDatabase,
  type SqlExecutor,
} from '../../../src/infrastructure/database/sqlDatabase';
import type { Pbkdf2Engine } from '../../../src/infrastructure/security/pbkdf2Engine';
import { AccountRecoveryService } from '../../../src/services/authentication/accountRecovery';
import { AccountRegistrationService } from '../../../src/services/authentication/accountRegistration';
import type { RegistrationInput } from '../../../src/services/authentication/registrationValidation';
import { verifySecret } from '../../../src/services/authentication/secretVerifier';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../../testing/nodeSqliteDatabase';
import {
  createMigratedDatabase,
  TEST_PARAMETERS,
} from '../../../testing/identityFixtures';

const PASSWORD = 'Clave segura 1!';

function input(overrides: Partial<RegistrationInput> = {}): RegistrationInput {
  return {
    documentTypeCode: 'CC',
    documentNumber: '1.020.304.050',
    firstName: ' Íñigo ',
    middleName: '',
    lastName: 'Peña',
    secondLastName: '  ',
    phoneCountryCode: '+57',
    phoneNumber: '300 111 2233',
    email: ' Inigo@Example.com ',
    password: PASSWORD,
    securityAnswers: [
      { questionId: 'favorite-color', answer: 'Azul cielo' },
      { questionId: 'first-pet', answer: 'Perro criollo' },
      { questionId: 'favorite-sport', answer: 'Fútbol' },
      { questionId: 'favorite-dish', answer: 'Bandeja paisa' },
      { questionId: 'school-transport', answer: 'Bus escolar' },
    ],
    ...overrides,
  };
}

function service(
  database: SqlDatabase,
  engine: Pbkdf2Engine = nodePbkdf2Engine,
): AccountRegistrationService {
  return new AccountRegistrationService({
    database,
    engine,
    random: nodeRandomBytes,
    now: () => 1_700_000_000_000,
    parameters: TEST_PARAMETERS,
  });
}

async function count(database: SqlDatabase, table: string): Promise<number> {
  const result = await database.execute(
    `SELECT count(*) AS total FROM ${table}`,
  );
  return readInteger(result.rows[0], 'total');
}

describe('account registration (HU1)', () => {
  test('stores a valid account with normalized identifiers (HU1-CA15, A-ID1 to A-ID4)', async () => {
    const database = await createMigratedDatabase();
    await expect(service(database).register(input())).resolves.toEqual({
      status: 'registered',
    });
    const users = await database.execute(
      `SELECT document_type_code, document_number, document_number_normalized, first_name,
         middle_name, last_name, second_last_name, phone_country_code, phone_number,
         phone_e164, email, email_normalized, created_at FROM users`,
    );
    expect(users.rows).toEqual([
      {
        document_type_code: 'CC',
        document_number: '1.020.304.050',
        document_number_normalized: '1020304050',
        first_name: 'Íñigo',
        middle_name: null,
        last_name: 'Peña',
        second_last_name: null,
        phone_country_code: '+57',
        phone_number: '3001112233',
        phone_e164: '+573001112233',
        email: 'Inigo@Example.com',
        email_normalized: 'inigo@example.com',
        created_at: 1_700_000_000_000,
      },
    ]);
    expect(await count(database, 'credentials')).toBe(1);
    expect(await count(database, 'security_answers')).toBe(5);
  });

  test('never stores the password or the answers in plain text (HU1-CA06, HU1-CA12)', async () => {
    const database = await createMigratedDatabase();
    await service(database).register(input());
    const userId = (await database.execute('SELECT id FROM users')).rows[0]
      .id as string;
    const repository = new IdentityRepository(database);
    const credential = await repository.getCredential(userId);
    expect(credential?.normalization).toBe('nfc');
    await expect(
      verifySecret(PASSWORD, credential!, nodePbkdf2Engine),
    ).resolves.toBe(true);
    const answer = await repository.getSecurityAnswer(userId, 'favorite-sport');
    expect(answer?.normalization).toBe('free-text-folded');
    await expect(
      verifySecret('  FUTBOL ', answer!, nodePbkdf2Engine),
    ).resolves.toBe(true);
    const secrets = [
      PASSWORD,
      ...input().securityAnswers.map(a => a.answer),
      'futbol',
      'azul cielo',
    ];
    for (const table of ['users', 'credentials', 'security_answers']) {
      const rows = (await database.execute(`SELECT * FROM ${table}`)).rows;
      const dump = JSON.stringify(rows, (_key, value) =>
        value instanceof Uint8Array
          ? Array.from(value, byte => String.fromCharCode(byte)).join('')
          : value,
      ).toLowerCase();
      for (const secret of secrets) {
        expect(dump).not.toContain(secret.toLowerCase());
      }
    }
  });

  test('rejects invalid data field by field and saves nothing (HU1-CA01, HU1-CA13)', async () => {
    const database = await createMigratedDatabase();
    const result = await service(database).register(
      input({
        documentTypeCode: 'NIT',
        documentNumber: '12#3',
        firstName: '',
        middleName: 'J4',
        lastName: "O'Connor",
        secondLastName: 'Ruiz-Díaz',
        phoneCountryCode: '+999',
        phoneNumber: 'abc',
        email: 'ana@example',
        password: 'corta',
        securityAnswers: [
          { questionId: 'favorite-dish', answer: 'Ajiaco' },
          { questionId: 'favorite-fruit', answer: 'Mango' },
          { questionId: 'favorite-color', answer: 'n' },
          { questionId: 'favorite-color', answer: 'Rojo' },
          { questionId: '', answer: 'Algo más' },
        ],
      }),
    );
    expect(result).toEqual({
      status: 'invalid',
      errors: {
        fields: {
          documentTypeCode: 'not_in_list',
          documentNumber: 'document_characters',
          firstName: 'required',
          middleName: 'name_characters',
          lastName: 'name_characters',
          secondLastName: 'name_characters',
          phoneCountryCode: 'not_in_list',
          phoneNumber: 'phone_characters',
          email: 'email_format',
          password: 'password_policy',
        },
        securityAnswers: [
          { question: null, answer: null },
          { question: 'repeated', answer: null },
          { question: null, answer: 'too_short' },
          { question: 'repeated', answer: null },
          { question: 'required', answer: null },
        ],
        securityAnswerCountValid: true,
      },
    });
    expect(await count(database, 'users')).toBe(0);
  });

  test('rejects letters in a CC also in the service, and accepts them for a passport (E03-V06, partial)', async () => {
    const database = await createMigratedDatabase();
    const registration = service(database);
    await expect(
      registration.register(input({ documentNumber: '12A45' })),
    ).resolves.toMatchObject({
      status: 'invalid',
      errors: { fields: { documentNumber: 'document_digits_only' } },
    });
    expect(await count(database, 'users')).toBe(0);
    await expect(
      registration.register(
        input({ documentTypeCode: 'PA', documentNumber: 'ab123456' }),
      ),
    ).resolves.toEqual({ status: 'registered' });
    const users = await database.execute(
      'SELECT document_number, document_number_normalized FROM users',
    );
    expect(users.rows).toEqual([
      { document_number: 'ab123456', document_number_normalized: 'AB123456' },
    ]);
  });

  test('keeps the leading zeros of a CC (A-ID3)', async () => {
    const database = await createMigratedDatabase();
    await expect(
      service(database).register(input({ documentNumber: '0012345' })),
    ).resolves.toEqual({ status: 'registered' });
    const users = await database.execute(
      'SELECT document_number, document_number_normalized FROM users',
    );
    expect(users.rows).toEqual([
      { document_number: '0012345', document_number_normalized: '0012345' },
    ]);
  });

  test('accepts two-character answers and recovers with them (E03-D5, 2026-10-26; HU3)', async () => {
    const database = await createMigratedDatabase();
    const shortAnswers = [
      { questionId: 'favorite-color', answer: 'Te' },
      { questionId: 'first-pet', answer: 'T\u00e9' },
      { questionId: 'favorite-sport', answer: 'Te\u0301' },
      { questionId: 'favorite-dish', answer: 'Ñu' },
      { questionId: 'school-transport', answer: 'a'.repeat(100) },
    ];
    await expect(
      service(database).register(input({ securityAnswers: shortAnswers })),
    ).resolves.toEqual({ status: 'registered' });
    await expect(
      service(database).register(
        input({
          documentNumber: '777',
          email: 'otro@example.com',
          phoneNumber: '3009998877',
          securityAnswers: [
            ...shortAnswers.slice(0, 4),
            { questionId: 'school-transport', answer: 'T' },
          ],
        }),
      ),
    ).resolves.toMatchObject({
      status: 'invalid',
      errors: { securityAnswers: [{}, {}, {}, {}, { answer: 'too_short' }] },
    });
    let now = 1_000_000;
    const recovery = new AccountRecoveryService({
      database,
      engine: nodePbkdf2Engine,
      random: nodeRandomBytes,
      now: () => now,
      parameters: TEST_PARAMETERS,
    });
    const started = await recovery.start('inigo@example.com');
    if (started.status !== 'challenge') {
      throw new Error(`unexpected ${started.status}`);
    }
    const typed: Record<string, string> = {
      'favorite-color': ' TE ',
      'first-pet': 'te',
      'favorite-sport': 'T\u00c9',
      'favorite-dish': 'nu',
      'school-transport': 'A'.repeat(100),
    };
    now += 1_000;
    await expect(
      recovery.complete(
        'inigo@example.com',
        started.questionIds.map(questionId => ({
          questionId,
          answer: typed[questionId],
        })),
        'Nueva clave 9#',
        'Nueva clave 9#',
      ),
    ).resolves.toEqual({ status: 'password_updated' });
  });

  test('requires exactly five security questions', async () => {
    const database = await createMigratedDatabase();
    const result = await service(database).register(
      input({ securityAnswers: input().securityAnswers.slice(0, 4) }),
    );
    expect(result.status).toBe('invalid');
    expect(await count(database, 'users')).toBe(0);
  });

  test('reports an existing user and checks it before the last step (HU1-CA14, A-W3)', async () => {
    const database = await createMigratedDatabase();
    const registration = service(database);
    await registration.register(input());
    await expect(
      registration.checkAvailability({
        documentNumber: '999',
        phoneCountryCode: '+57',
        phoneNumber: '3001112233',
        email: 'otra@example.com',
      }),
    ).resolves.toBe('already_registered');
    await expect(
      registration.checkAvailability({
        documentNumber: '999',
        phoneCountryCode: '+52',
        phoneNumber: '3001112233',
        email: 'otra@example.com',
      }),
    ).resolves.toBe('available');
    await expect(
      registration.register(
        input({ documentNumber: '999', phoneNumber: '3009999999' }),
      ),
    ).resolves.toEqual({ status: 'already_registered' });
    await expect(
      registration.register(
        input({
          documentNumber: '3001112233',
          phoneNumber: '3009999999',
          email: 'otra@example.com',
        }),
      ),
    ).resolves.toEqual({ status: 'already_registered' });
    expect(await count(database, 'users')).toBe(1);
  });

  test('concurrent registrations of the same identifiers create a single account', async () => {
    const database = await createMigratedDatabase();
    const first = service(database);
    const second = service(database);
    const results = await Promise.all([
      first.register(input()),
      second.register(input({ email: 'otro@example.com' })),
      first.register(
        input({ documentNumber: '777', phoneNumber: '3007777777' }),
      ),
    ]);
    expect(results.map(result => result.status).sort()).toEqual([
      'already_registered',
      'already_registered',
      'registered',
    ]);
    expect(await count(database, 'users')).toBe(1);
  });

  test('a technical failure leaves no partial account (A-W7)', async () => {
    const database = await createMigratedDatabase();
    let calls = 0;
    const failingEngine: Pbkdf2Engine = {
      async deriveHmacSha256(...args) {
        calls += 1;
        if (calls === 4) {
          throw new Error('native failure');
        }
        return nodePbkdf2Engine.deriveHmacSha256(...args);
      },
    };
    await expect(
      service(database, failingEngine).register(input()),
    ).resolves.toEqual({ status: 'failed' });
    expect(await count(database, 'users')).toBe(0);

    const failingWrites: SqlDatabase = {
      execute: (sql, params) => database.execute(sql, params),
      transaction: work =>
        database.transaction(executor => {
          const wrapped: SqlExecutor = {
            execute: (sql, params) =>
              /INSERT INTO security_answers/.test(sql)
                ? Promise.reject(new Error('disk I/O error'))
                : executor.execute(sql, params),
          };
          return work(wrapped);
        }),
      close: () => database.close(),
    };
    await expect(service(failingWrites).register(input())).resolves.toEqual({
      status: 'failed',
    });
    for (const table of ['users', 'credentials', 'security_answers']) {
      expect(await count(database, table)).toBe(0);
    }
  });

  test('lists only active document types and the ten security questions', async () => {
    const database = await createMigratedDatabase();
    const registration = service(database);
    await expect(registration.listDocumentTypes()).resolves.toHaveLength(4);
    const questions = await registration.listSecurityQuestions();
    expect(questions).toHaveLength(10);
    expect(questions[0]).toEqual({
      id: 'favorite-color',
      prompt: '¿Cuál es tu color favorito?',
      similarityGroup: 'color',
    });
  });

  test('accounts registered with written answers can be recovered (HU3 compatibility)', async () => {
    const database = await createMigratedDatabase();
    await service(database).register(input());
    const recovery = new AccountRecoveryService({
      database,
      engine: nodePbkdf2Engine,
      random: nodeRandomBytes,
      now: () => 1_700_000_000_000,
      parameters: TEST_PARAMETERS,
    });
    const started = await recovery.start('+57 300 111 2233');
    if (started.status !== 'challenge') {
      throw new Error(`unexpected ${started.status}`);
    }
    const answers = started.questionIds.map(questionId => ({
      questionId,
      answer: input()
        .securityAnswers.find(a => a.questionId === questionId)!
        .answer.toUpperCase(),
    }));
    await expect(
      recovery.complete(
        'inigo@example.com',
        answers,
        'Otra clave 2#',
        'Otra clave 2#',
      ),
    ).resolves.toEqual({ status: 'password_updated' });
  });
});

import { IdentityRepository } from '../../../src/infrastructure/database/repositories/identityRepository';
import type { SqlDatabase } from '../../../src/infrastructure/database/sqlDatabase';
import type { Pbkdf2Engine } from '../../../src/infrastructure/security/pbkdf2Engine';
import {
  AccountLoginService,
  LOGIN_THROTTLE_SUBJECT,
  validateLoginInput,
} from '../../../src/services/authentication/accountLogin';
import { SessionManager } from '../../../src/services/session/sessionManager';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
  TEST_PARAMETERS,
} from '../../../testing/identityFixtures';

const PASSWORD = 'Clave123!';
const MINUTE_MS = 60_000;

function countingEngine() {
  const engine = {
    derivations: 0,
    async deriveHmacSha256(
      ...args: Parameters<Pbkdf2Engine['deriveHmacSha256']>
    ) {
      engine.derivations++;
      return nodePbkdf2Engine.deriveHmacSha256(...args);
    },
  };
  return engine;
}

async function setup(start = 1_000_000) {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const clock = { now: start };
  const engine = countingEngine();
  const sessions = new SessionManager(nodeRandomBytes, () => clock.now);
  const service = (db: SqlDatabase = database) =>
    new AccountLoginService({
      database: db,
      engine,
      sessions,
      random: nodeRandomBytes,
      now: () => clock.now,
      parameters: TEST_PARAMETERS,
    });
  return {
    database,
    userId,
    clock,
    engine,
    sessions,
    login: service(),
    service,
  };
}

describe('HU2 login (accountLogin)', () => {
  test.each([
    ['email', 'ana@example.com'],
    ['email in another case with spaces (A-ID1)', '  ANA@Example.COM '],
    ['normalized document (A-ID3)', '1.001'],
    ['E.164 mobile number (A-ID2)', '+573001112233'],
    ['E.164 mobile number with separators', '+57 300 111 2233'],
    ['unambiguous national mobile number (A-ID2)', '3001112233'],
  ])(
    'HU2-CA01, CA07: authenticates with the %s and starts a session for that user',
    async (_label, identifier) => {
      const { login, userId, sessions } = await setup();
      const result = await login.login(identifier, PASSWORD);
      expect(result.status).toBe('authenticated');
      if (result.status === 'authenticated') {
        expect(result.session.userId).toBe(userId);
        expect(sessions.current()).toBe(result.session);
      }
    },
  );

  test('HU2-CA02: identifier and password are required and nothing is attempted', async () => {
    const { login, engine, database } = await setup();
    expect(await login.login('', '')).toEqual({
      status: 'invalid_input',
      errors: { identifier: 'required', password: 'required' },
    });
    expect(await login.login('   ', PASSWORD)).toEqual({
      status: 'invalid_input',
      errors: { identifier: 'required' },
    });
    expect(await login.login('ana@example.com', '')).toEqual({
      status: 'invalid_input',
      errors: { password: 'required' },
    });
    expect(engine.derivations).toBe(0);
    expect(
      await new IdentityRepository(database).getThrottle(
        'login',
        LOGIN_THROTTLE_SUBJECT,
      ),
    ).toBeNull();
  });

  test.each([
    'ana@',
    'ana@example',
    '@example.com',
    'ana @example.com',
    'a@b@c.com',
  ])(
    'HU2-CA04: «%s» is rejected as «Verificar identificación» without counting an attempt',
    async identifier => {
      const { login, engine } = await setup();
      expect(await login.login(identifier, PASSWORD)).toEqual({
        status: 'invalid_input',
        errors: { identifier: 'identifier_format' },
      });
      expect(engine.derivations).toBe(0);
    },
  );

  test('validateLoginInput accepts documents and phones without an e-mail check', () => {
    expect(validateLoginInput('1001', 'x')).toEqual({});
    expect(validateLoginInput('+573001112233', 'x')).toEqual({});
    expect(validateLoginInput('ana@example.com', 'x')).toEqual({});
  });

  test('HU2-CA05: a wrong password and an unknown identifier give the same result and cost', async () => {
    const { login, engine, sessions } = await setup();
    const wrong = await login.login('ana@example.com', 'Otra123!');
    const wrongDerivations = engine.derivations;
    const unknown = await login.login('nadie@example.com', PASSWORD);
    expect(wrong).toEqual({ status: 'invalid_credentials', lockedForMs: null });
    expect(unknown).toEqual(wrong);
    expect(wrongDerivations).toBe(1);
    expect(engine.derivations).toBe(2);
    expect(sessions.current()).toBeNull();
  });

  test('HU2-CA05: a password with control characters is a wrong password, not an error', async () => {
    const { login } = await setup();
    expect(await login.login('ana@example.com', 'Clave\u0000123!')).toEqual({
      status: 'invalid_credentials',
      lockedForMs: null,
    });
  });

  test('A-ID2: an ambiguous national number asks for the country code without counting an attempt', async () => {
    const { database, login, engine } = await setup();
    await createAccount(
      database,
      profile({
        documentNumber: '2002',
        email: 'beto@example.com',
        phoneCountryCode: '+52',
      }),
    );
    expect(await login.login('3001112233', PASSWORD)).toEqual({
      status: 'phone_country_code_required',
    });
    expect(engine.derivations).toBe(0);
    expect(
      await new IdentityRepository(database).getThrottle(
        'login',
        LOGIN_THROTTLE_SUBJECT,
      ),
    ).toBeNull();
    expect((await login.login('+523001112233', PASSWORD)).status).toBe(
      'authenticated',
    );
  });

  test('HU2-CA06: three failures lock access for 15 minutes, even with the right password', async () => {
    const { login, clock, engine } = await setup();
    expect(await login.login('ana@example.com', 'mala1')).toMatchObject({
      lockedForMs: null,
    });
    clock.now += 1000;
    expect(await login.login('nadie@example.com', 'mala2')).toMatchObject({
      lockedForMs: null,
    });
    clock.now += 1000;
    expect(await login.login('1001', 'mala3')).toEqual({
      status: 'invalid_credentials',
      lockedForMs: 15 * MINUTE_MS,
    });
    const derivations = engine.derivations;
    clock.now += 14 * MINUTE_MS;
    expect(await login.login('ana@example.com', PASSWORD)).toEqual({
      status: 'locked',
      retryAfterMs: MINUTE_MS,
    });
    expect(engine.derivations).toBe(derivations);
    clock.now += MINUTE_MS;
    expect((await login.login('ana@example.com', PASSWORD)).status).toBe(
      'authenticated',
    );
  });

  test('HU2-CA06: after a lock expires the user gets three new attempts of 15 minutes', async () => {
    const { login, clock } = await setup();
    for (let attempt = 0; attempt < 3; attempt++) {
      await login.login('ana@example.com', 'mala');
    }
    clock.now += 15 * MINUTE_MS;
    expect(await login.login('ana@example.com', 'mala')).toMatchObject({
      lockedForMs: null,
    });
    await login.login('ana@example.com', 'mala');
    expect(await login.login('ana@example.com', 'mala')).toEqual({
      status: 'invalid_credentials',
      lockedForMs: 15 * MINUTE_MS,
    });
  });

  test('a successful login resets the failure count', async () => {
    const { login } = await setup();
    await login.login('ana@example.com', 'mala');
    await login.login('ana@example.com', 'mala');
    expect((await login.login('ana@example.com', PASSWORD)).status).toBe(
      'authenticated',
    );
    await login.login('ana@example.com', 'mala');
    expect(await login.login('ana@example.com', 'mala')).toMatchObject({
      lockedForMs: null,
    });
  });

  test('the lock survives a restart: it is stored in the database and shared between instances', async () => {
    const { login, service } = await setup();
    for (let attempt = 0; attempt < 3; attempt++) {
      await login.login('ana@example.com', 'mala');
    }
    expect((await service().login('ana@example.com', PASSWORD)).status).toBe(
      'locked',
    );
  });

  test('a clock moved backwards keeps the lock', async () => {
    const { login, clock } = await setup();
    for (let attempt = 0; attempt < 3; attempt++) {
      await login.login('ana@example.com', 'mala');
    }
    clock.now -= 60 * MINUTE_MS;
    expect((await login.login('ana@example.com', PASSWORD)).status).toBe(
      'locked',
    );
  });

  test('evaluates at most three concurrent wrong attempts before locking', async () => {
    const { login, service, engine } = await setup();
    const other = service();
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        (index % 2 === 0 ? login : other).login('ana@example.com', 'mala'),
      ),
    );
    expect(
      results.filter(r => r.status === 'invalid_credentials'),
    ).toHaveLength(3);
    expect(results.filter(r => r.status === 'locked')).toHaveLength(7);
    expect(engine.derivations).toBe(3);
  });

  test('a disabled account cannot log in and looks like an unknown identifier', async () => {
    const { login, database, userId } = await setup();
    await database.execute(
      "UPDATE users SET status = 'disabled' WHERE id = ?",
      [userId],
    );
    expect(await login.login('ana@example.com', PASSWORD)).toEqual({
      status: 'invalid_credentials',
      lockedForMs: null,
    });
  });

  test('HU2-CA11: each login opens a session only for its own account and replaces the previous one', async () => {
    const { database, login, userId, sessions } = await setup();
    const otherId = await createAccount(
      database,
      profile({
        documentNumber: '2002',
        email: 'beto@example.com',
        phoneNumber: '3009998877',
      }),
      'Otra456!',
    );
    const first = await login.login('ana@example.com', PASSWORD);
    const second = await login.login('beto@example.com', 'Otra456!');
    if (first.status !== 'authenticated' || second.status !== 'authenticated') {
      throw new Error('both logins should succeed');
    }
    expect(first.session.userId).toBe(userId);
    expect(second.session.userId).toBe(otherId);
    expect(() => sessions.requireOwner(first.session)).toThrow('stale_session');
    expect(sessions.requireOwner(second.session)).toBe(otherId);
  });

  test('HU2-CA03: credentials are never returned and stay as PBKDF2 verifiers', async () => {
    const { login, database } = await setup();
    const results = [
      await login.login('ana@example.com', 'Incorrecta9!'),
      await login.login('ana@example.com', PASSWORD),
    ];
    for (const result of results) {
      expect(JSON.stringify(result)).not.toContain('Incorrecta9!');
      expect(JSON.stringify(result)).not.toContain(PASSWORD);
    }
    const rows = await database.execute('SELECT * FROM credentials');
    expect(JSON.stringify(rows.rows)).not.toContain(PASSWORD);
    expect(rows.rows[0].algorithm).toBe('pbkdf2-hmac-sha256');
  });

  test('regenerates a credential with outdated parameters after a successful login', async () => {
    const { database, userId, clock, sessions } = await setup();
    const repository = new IdentityRepository(database);
    const before = await repository.getCredential(userId);
    const upgraded = new AccountLoginService({
      database,
      engine: nodePbkdf2Engine,
      sessions,
      random: nodeRandomBytes,
      now: () => clock.now,
      parameters: { ...TEST_PARAMETERS, iterations: 1200 },
    });
    expect((await upgraded.login('ana@example.com', PASSWORD)).status).toBe(
      'authenticated',
    );
    const after = await repository.getCredential(userId);
    expect(before?.iterations).toBe(1000);
    expect(after?.iterations).toBe(1200);
    expect(after?.salt).not.toEqual(before?.salt);
    expect((await upgraded.login('ana@example.com', PASSWORD)).status).toBe(
      'authenticated',
    );
  });

  test('a database error gives a generic failure without details and opens no session', async () => {
    const { database, sessions, service } = await setup();
    const broken: SqlDatabase = {
      ...database,
      execute: () => Promise.reject(new Error('SQLITE_IOERR secret detail')),
    };
    const result = await service(broken).login('ana@example.com', PASSWORD);
    expect(result).toEqual({ status: 'failed' });
    expect(sessions.current()).toBeNull();
  });
});

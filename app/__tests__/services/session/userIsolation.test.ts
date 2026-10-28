import {
  AccountAlreadyRegisteredError,
  IdentityRepository,
} from '../../../src/infrastructure/database/repositories/identityRepository';
import { UserProfileRepository } from '../../../src/infrastructure/database/repositories/userProfileRepository';
import { readInteger } from '../../../src/infrastructure/database/sqlDatabase';
import {
  SessionError,
  SessionManager,
} from '../../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../../testing/identityFixtures';

async function twoUsers() {
  const database = await createMigratedDatabase();
  const ana = await createAccount(database, profile());
  const luis = await createAccount(
    database,
    profile({
      documentNumber: '2002',
      email: 'luis@example.com',
      phoneNumber: '3004445566',
      firstName: 'Luis',
    }),
  );
  return { database, ana, luis };
}

describe('local multi-user isolation (E02-D4)', () => {
  test('each session only reaches its own profile', async () => {
    const { database, ana, luis } = await twoUsers();
    const sessions = new SessionManager(nodeRandomBytes);
    const profiles = new UserProfileRepository(database, sessions);
    const anaSession = sessions.start(ana);
    expect((await profiles.getOwnProfile(anaSession))?.userId).toBe(ana);
    const luisSession = sessions.start(luis);
    expect((await profiles.getOwnProfile(luisSession))?.firstName).toBe('Luis');
    await expect(profiles.getOwnProfile(anaSession)).rejects.toMatchObject({
      reason: 'stale_session',
    });
  });

  test('a forged session object with another user id is rejected', async () => {
    const { database, ana, luis } = await twoUsers();
    const sessions = new SessionManager(nodeRandomBytes);
    const profiles = new UserProfileRepository(database, sessions);
    const anaSession = sessions.start(ana);
    const forged = { ...anaSession, userId: luis };
    await expect(profiles.getOwnProfile(forged)).rejects.toBeInstanceOf(
      SessionError,
    );
  });

  test('logging out blocks the previous session', async () => {
    const { database, ana } = await twoUsers();
    const sessions = new SessionManager(nodeRandomBytes);
    const profiles = new UserProfileRepository(database, sessions);
    const session = sessions.start(ana);
    sessions.end();
    expect(sessions.current()).toBeNull();
    await expect(profiles.getOwnProfile(session)).rejects.toMatchObject({
      reason: 'no_active_session',
    });
  });

  test('owned rows disappear with their owner and never leak to others', async () => {
    const { database, ana, luis } = await twoUsers();
    await database.execute('DELETE FROM users WHERE id = ?', [ana]);
    const answers = await database.execute(
      'SELECT user_id, count(*) AS total FROM security_answers GROUP BY user_id',
    );
    expect(answers.rows).toEqual([{ user_id: luis, total: 5 }]);
    const credentials = await database.execute(
      'SELECT count(*) AS total FROM credentials',
    );
    expect(readInteger(credentials.rows[0], 'total')).toBe(1);
  });
});

describe('already registered users (E03-D3)', () => {
  test.each([
    [
      'document number',
      profile({ email: 'otra@example.com', phoneNumber: '3009999999' }),
    ],
    [
      'email ignoring case',
      profile({
        documentNumber: '3003',
        email: ' ANA@Example.com',
        phoneNumber: '3009999999',
      }),
    ],
    [
      'phone with the same country code',
      profile({ documentNumber: '3003', email: 'otra@example.com' }),
    ],
  ])('rejects a duplicate %s', async (_label, duplicate) => {
    const database = await createMigratedDatabase();
    await createAccount(database, profile());
    await expect(createAccount(database, duplicate)).rejects.toBeInstanceOf(
      AccountAlreadyRegisteredError,
    );
    const users = await database.execute('SELECT count(*) AS total FROM users');
    expect(readInteger(users.rows[0], 'total')).toBe(1);
  });

  test('allows the same national number in another country', async () => {
    const database = await createMigratedDatabase();
    await createAccount(database, profile());
    await createAccount(
      database,
      profile({
        documentNumber: '5005',
        email: 'c@example.com',
        phoneCountryCode: '+52',
      }),
    );
    const users = await database.execute('SELECT count(*) AS total FROM users');
    expect(readInteger(users.rows[0], 'total')).toBe(2);
  });

  test('finds users by email, document or phone and refuses ambiguous phones', async () => {
    const { database, ana } = await twoUsers();
    const repository = new IdentityRepository(database);
    await expect(
      repository.findUserIdByIdentifier('ANA@example.com '),
    ).resolves.toBe(ana);
    await expect(repository.findUserIdByIdentifier('1001')).resolves.toBe(ana);
    await expect(
      repository.findUserIdByIdentifier('300 111 2233'),
    ).resolves.toBe(ana);
    await expect(
      repository.findUserIdByIdentifier('+57 300 111 2233'),
    ).resolves.toBe(ana);
    await expect(
      repository.findUserIdByIdentifier('nadie@example.com'),
    ).resolves.toBeNull();
    await createAccount(
      database,
      profile({
        documentNumber: '6006',
        email: 'd@example.com',
        phoneCountryCode: '+52',
      }),
    );
    await expect(
      repository.findUserIdByIdentifier('3001112233'),
    ).resolves.toBeNull();
  });
});

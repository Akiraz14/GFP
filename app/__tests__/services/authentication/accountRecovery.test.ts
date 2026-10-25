import { IdentityRepository } from '../../../src/infrastructure/database/repositories/identityRepository';
import {
  AccountRecoveryService,
  RECOVERY_CHALLENGE_TTL_MS,
} from '../../../src/services/authentication/accountRecovery';
import { verifySecret } from '../../../src/services/authentication/secretVerifier';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  DEFAULT_ANSWERS,
  profile,
  TEST_PARAMETERS,
} from '../../../testing/identityFixtures';

const MINUTE = 60_000;
const NEW_PASSWORD = 'Nueva clave 9#';

function answerFor(questionId: string, optionId?: string) {
  const configured = DEFAULT_ANSWERS.find(
    answer => answer.questionId === questionId,
  );
  return { questionId, optionId: optionId ?? configured?.optionId ?? '' };
}

async function setup() {
  const database = await createMigratedDatabase();
  const ana = await createAccount(database, profile());
  const luis = await createAccount(
    database,
    profile({
      documentNumber: '2002',
      email: 'luis@example.com',
      phoneNumber: '3004445566',
    }),
    'Luis1234!',
    [
      { questionId: 'favorite-color', optionId: 'red' },
      { questionId: 'first-pet', optionId: 'cat' },
      { questionId: 'favorite-sport', optionId: 'tennis' },
      { questionId: 'favorite-dish', optionId: 'pizza' },
      { questionId: 'favorite-music-genre', optionId: 'rock' },
    ],
  );
  let now = 1_000_000;
  const clock = { advance: (ms: number) => (now += ms) };
  const service = new AccountRecoveryService({
    database,
    engine: nodePbkdf2Engine,
    random: nodeRandomBytes,
    now: () => now,
    parameters: TEST_PARAMETERS,
  });
  return { database, ana, luis, service, clock };
}

async function challenge(
  service: AccountRecoveryService,
  identifier = 'ana@example.com',
) {
  const result = await service.start(identifier);
  if (result.status !== 'challenge') {
    throw new Error(`unexpected ${result.status}`);
  }
  return result.questionIds;
}

describe('account recovery with security questions (HU3)', () => {
  test('asks two different configured questions and keeps them for the challenge', async () => {
    const { service } = await setup();
    const first = await challenge(service);
    expect(new Set(first).size).toBe(2);
    first.forEach(id =>
      expect(DEFAULT_ANSWERS.map(a => a.questionId)).toContain(id),
    );
    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(challenge(service)).resolves.toEqual(first);
    }
  });

  test('reports an unknown identifier', async () => {
    const { service } = await setup();
    await expect(service.start('nadie@example.com')).resolves.toEqual({
      status: 'invalid_identifier',
    });
  });

  test('updates the password only after both answers are correct', async () => {
    const { database, ana, service } = await setup();
    const questions = await challenge(service);
    const result = await service.complete(
      'ana@example.com',
      questions.map(id => answerFor(id)),
      NEW_PASSWORD,
      NEW_PASSWORD,
    );
    expect(result).toEqual({ status: 'password_updated' });
    const credential = await new IdentityRepository(database).getCredential(
      ana,
    );
    await expect(
      verifySecret(NEW_PASSWORD, credential!, nodePbkdf2Engine),
    ).resolves.toBe(true);
    await expect(
      verifySecret('Clave123!', credential!, nodePbkdf2Engine),
    ).resolves.toBe(false);
    await expect(
      new IdentityRepository(database).getRecoveryChallenge(ana),
    ).resolves.toBeNull();
  });

  test('a single wrong answer fails without saying which one', async () => {
    const { database, ana, service } = await setup();
    const questions = await challenge(service);
    const answers = [
      answerFor(questions[0]),
      answerFor(questions[1], 'other-animal'),
    ];
    const result = await service.complete(
      'ana@example.com',
      answers,
      NEW_PASSWORD,
      NEW_PASSWORD,
    );
    expect(result).toEqual({ status: 'invalid_data' });
    const credential = await new IdentityRepository(database).getCredential(
      ana,
    );
    await expect(
      verifySecret('Clave123!', credential!, nodePbkdf2Engine),
    ).resolves.toBe(true);
  });

  test.each(['missing', 'extra', 'unexpected', 'case-changed'])(
    'rejects %s answers',
    async variant => {
      const { service } = await setup();
      const questions = await challenge(service);
      const valid = questions.map(id => answerFor(id));
      const outside = DEFAULT_ANSWERS.find(
        answer => !questions.includes(answer.questionId),
      )!;
      const answers = {
        missing: valid.slice(0, 1),
        extra: [...valid, outside],
        unexpected: [valid[0], outside],
        'case-changed': valid.map(answer => ({
          ...answer,
          optionId: answer.optionId.toUpperCase(),
        })),
      }[variant]!;
      await expect(
        service.complete(
          'ana@example.com',
          answers,
          NEW_PASSWORD,
          NEW_PASSWORD,
        ),
      ).resolves.toEqual({ status: 'invalid_data' });
    },
  );

  test('locks recovery after repeated failures with growing waits', async () => {
    const { service, clock } = await setup();
    const questions = await challenge(service);
    const wrong = questions.map(id => answerFor(id, 'no-sport'));
    for (let attempt = 0; attempt < 3; attempt++) {
      await service.complete(
        'ana@example.com',
        wrong,
        NEW_PASSWORD,
        NEW_PASSWORD,
      );
    }
    const locked = await service.start('ana@example.com');
    expect(locked).toEqual({ status: 'locked', retryAfterMs: 15 * MINUTE });
    await expect(
      service.complete(
        'ana@example.com',
        questions.map(id => answerFor(id)),
        NEW_PASSWORD,
        NEW_PASSWORD,
      ),
    ).resolves.toMatchObject({ status: 'locked' });
    clock.advance(15 * MINUTE);
    const next = await challenge(service);
    for (let attempt = 0; attempt < 3; attempt++) {
      await service.complete(
        'ana@example.com',
        next.map(id => answerFor(id, 'no-sport')),
        NEW_PASSWORD,
        NEW_PASSWORD,
      );
    }
    await expect(service.start('ana@example.com')).resolves.toEqual({
      status: 'locked',
      retryAfterMs: 30 * MINUTE,
    });
  });

  test('throttles repeated unknown identifiers', async () => {
    const { service } = await setup();
    for (let attempt = 0; attempt < 3; attempt++) {
      await service.start(`nadie${attempt}@example.com`);
    }
    await expect(service.start('ana@example.com')).resolves.toMatchObject({
      status: 'locked',
    });
  });

  test('applies the password policy and the confirmation before checking answers', async () => {
    const { service } = await setup();
    const questions = await challenge(service);
    const answers = questions.map(id => answerFor(id));
    await expect(
      service.complete('ana@example.com', answers, 'corta1!', 'corta1!'),
    ).resolves.toEqual({
      status: 'password_rejected',
      violations: ['too_short'],
    });
    await expect(
      service.complete(
        'ana@example.com',
        answers,
        NEW_PASSWORD,
        `${NEW_PASSWORD}x`,
      ),
    ).resolves.toEqual({ status: 'confirmation_mismatch' });
  });

  test('accepts NFD input for the new password and stores it as NFC', async () => {
    const { database, ana, service } = await setup();
    const questions = await challenge(service);
    const nfd = 'Contraseña 9#';
    await service.complete(
      'ana@example.com',
      questions.map(id => answerFor(id)),
      nfd,
      nfd,
    );
    const credential = await new IdentityRepository(database).getCredential(
      ana,
    );
    await expect(
      verifySecret('Contraseña 9#', credential!, nodePbkdf2Engine),
    ).resolves.toBe(true);
  });

  test('expires challenges and never lets one user recover another', async () => {
    const { database, ana, luis, service, clock } = await setup();
    const anaQuestions = await challenge(service);
    clock.advance(RECOVERY_CHALLENGE_TTL_MS);
    await expect(
      service.complete(
        'ana@example.com',
        anaQuestions.map(id => answerFor(id)),
        NEW_PASSWORD,
        NEW_PASSWORD,
      ),
    ).resolves.toEqual({ status: 'invalid_data' });
    const luisQuestions = await challenge(service, 'luis@example.com');
    await expect(
      service.complete(
        'luis@example.com',
        luisQuestions.map(id => answerFor(id)),
        NEW_PASSWORD,
        NEW_PASSWORD,
      ),
    ).resolves.toEqual({ status: 'invalid_data' });
    const repository = new IdentityRepository(database);
    await expect(
      verifySecret(
        'Clave123!',
        (await repository.getCredential(ana))!,
        nodePbkdf2Engine,
      ),
    ).resolves.toBe(true);
    await expect(
      verifySecret(
        'Luis1234!',
        (await repository.getCredential(luis))!,
        nodePbkdf2Engine,
      ),
    ).resolves.toBe(true);
  });
});

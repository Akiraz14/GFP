import { fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { IdentityRepository } from '../../src/infrastructure/database/repositories/identityRepository';
import { PasswordRecoveryScreen } from '../../src/presentation/recovery/PasswordRecoveryScreen';
import {
  AccountRecoveryService,
  RECOVERY_CHALLENGE_TTL_MS,
  type RecoveryGateway,
} from '../../src/services/authentication/accountRecovery';
import { verifySecret } from '../../src/services/authentication/secretVerifier';
import type { SecurityQuestion } from '../../src/services/authentication/securityQuestionPolicy';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  DEFAULT_ANSWERS,
  profile,
  TEST_PARAMETERS,
} from '../../testing/identityFixtures';

jest.setTimeout(20_000);

const INVALID_DATA = 'Datos ingresados incorrectos';
const NEW_PASSWORD = 'Nueva clave 9#';
const MINUTE = 60_000;

async function setup(gateway?: RecoveryGateway) {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  let now = 1_000_000;
  const clock = { advance: (ms: number) => (now += ms) };
  const service =
    gateway ??
    new AccountRecoveryService({
      database,
      engine: nodePbkdf2Engine,
      random: nodeRandomBytes,
      now: () => now,
      parameters: TEST_PARAMETERS,
    });
  const catalog: SecurityQuestion[] = await new IdentityRepository(
    database,
  ).getSecurityQuestionCatalog();
  const onNavigate = jest.fn();
  await render(
    <PasswordRecoveryScreen gateway={service} onNavigate={onNavigate} />,
  );
  return { database, userId, catalog, clock, onNavigate };
}

async function type(testID: string, text: string) {
  await fireEvent.changeText(screen.getByTestId(testID), text);
}

async function startWith(identifier = 'ana@example.com') {
  await type('recovery-identifier', identifier);
  await fireEvent.press(screen.getByTestId('recovery-start'));
}

function questionIdOf(index: number, catalog: SecurityQuestion[]): string {
  const prompt = screen.getByTestId(`recovery-answer-${index}`).props
    .accessibilityLabel;
  return catalog.find(question => question.prompt === prompt)!.id;
}

async function answerQuestions(catalog: SecurityQuestion[], override?: string) {
  for (const index of [0, 1]) {
    const id = questionIdOf(index, catalog);
    await type(
      `recovery-answer-${index}`,
      override ??
        DEFAULT_ANSWERS.find(answer => answer.questionId === id)!.answer,
    );
  }
}

async function fillPasswords(password: string, confirmation = password) {
  await type('recovery-new-password', password);
  await type('recovery-confirmation', confirmation);
}

async function update() {
  await fireEvent.press(screen.getByTestId('recovery-update'));
}

async function passwordIs(
  database: Awaited<ReturnType<typeof setup>>['database'],
  userId: string,
  password: string,
) {
  const credential = await new IdentityRepository(database).getCredential(
    userId,
  );
  return verifySecret(password, credential!, nodePbkdf2Engine);
}

async function acceptDialog() {
  await fireEvent.press(screen.getByTestId('dialog-accept'));
}

describe('HU3 password recovery screen', () => {
  test('HU3-CA01: asks only for the identifier first, with the literal names', async () => {
    await setup();
    expect(screen.getByText('Recuperar contraseña')).toBeTruthy();
    expect(screen.getByLabelText('Identificador')).toBeTruthy();
    expect(
      screen.getByText(
        'Correo electrónico, número de documento o número de celular',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Comenzar recuperación')).toBeTruthy();
    expect(screen.queryByTestId('recovery-challenge')).toBeNull();
    expect(screen.queryByText('Actualizar contraseña')).toBeNull();
    expect(screen.queryByLabelText('Nueva contraseña')).toBeNull();
  });

  test.each([
    ['the email', 'ANA@example.com'],
    ['the document', '1001'],
    ['the phone number', '+57 300 111 2233'],
  ])('HU3-CA02: accepts %s as identifier', async (_label, identifier) => {
    await setup();
    await startWith(identifier);
    expect(await screen.findByTestId('recovery-challenge')).toBeTruthy();
  });

  test.each([
    ['an unknown identifier', 'nadie@example.com'],
    ['a malformed email', 'ana@example'],
    ['an unknown document', '999999'],
  ])(
    'HU3-CA03: «Comenzar recuperación» rejects %s with «Identificador incorrecto»',
    async (_label, identifier) => {
      await setup();
      await startWith(identifier);
      expect(await screen.findByText('Identificador incorrecto')).toBeTruthy();
      expect(screen.queryByTestId('recovery-challenge')).toBeNull();
    },
  );

  test('HU3-CA03: the identifier is required', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('recovery-start'));
    expect(screen.getByText('Ingresa tu identificador.')).toBeTruthy();
    expect(screen.queryByTestId('recovery-challenge')).toBeNull();
  });

  test('HU3-CA04: a valid identifier asks two of the configured questions and the new password', async () => {
    const { catalog } = await setup();
    await startWith();
    await screen.findByTestId('recovery-challenge');
    const ids = [questionIdOf(0, catalog), questionIdOf(1, catalog)];
    expect(new Set(ids).size).toBe(2);
    ids.forEach(id =>
      expect(DEFAULT_ANSWERS.map(answer => answer.questionId)).toContain(id),
    );
    expect(screen.getByLabelText('Nueva contraseña')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar nueva contraseña')).toBeTruthy();
    expect(screen.getByText('Actualizar contraseña')).toBeTruthy();
    expect(screen.getByTestId('recovery-identifier').props.editable).toBe(
      false,
    );
  });

  test('HU3-CA05, CA08, CA09: a weak password shows «Datos ingresados incorrectos» and changes nothing', async () => {
    const { database, userId, catalog } = await setup();
    await startWith();
    await screen.findByTestId('recovery-challenge');
    await answerQuestions(catalog);
    await fillPasswords('sinnumero!');
    await update();
    expect(screen.getByTestId('dialog-recovery')).toBeTruthy();
    expect(screen.getAllByText(INVALID_DATA)).toHaveLength(2);
    expect(
      screen.getByTestId('recovery-password-requirements-number'),
    ).toBeTruthy();
    await expect(passwordIs(database, userId, 'Clave123!')).resolves.toBe(true);
  });

  test('HU3-CA06: the password fields hide what is typed', async () => {
    await setup();
    await startWith();
    await screen.findByTestId('recovery-challenge');
    expect(
      screen.getByTestId('recovery-new-password').props.secureTextEntry,
    ).toBe(true);
    expect(
      screen.getByTestId('recovery-confirmation').props.secureTextEntry,
    ).toBe(true);
  });

  test('HU3-CA07: the confirmation must match the new password', async () => {
    const { database, userId, catalog } = await setup();
    await startWith();
    await screen.findByTestId('recovery-challenge');
    await answerQuestions(catalog);
    await fillPasswords(NEW_PASSWORD, `${NEW_PASSWORD}x`);
    await update();
    expect(
      screen.getByText('La confirmación no coincide con la nueva contraseña.'),
    ).toBeTruthy();
    expect(screen.getByTestId('dialog-recovery')).toBeTruthy();
    await expect(passwordIs(database, userId, NEW_PASSWORD)).resolves.toBe(
      false,
    );
  });

  test('HU3-CA08: empty answers are rejected before contacting the service', async () => {
    const complete = jest.fn();
    const database = await createMigratedDatabase();
    const catalog = await new IdentityRepository(
      database,
    ).getSecurityQuestionCatalog();
    const gateway: RecoveryGateway = {
      listSecurityQuestions: async () => catalog,
      start: async () => ({
        status: 'challenge',
        questionIds: ['first-pet', 'favorite-dish'],
      }),
      complete: async (...args) => {
        complete(...args);
        return { status: 'password_updated' };
      },
    };
    await render(
      <PasswordRecoveryScreen gateway={gateway} onNavigate={jest.fn()} />,
    );
    await startWith();
    await screen.findByTestId('recovery-challenge');
    await fillPasswords(NEW_PASSWORD);
    await update();
    expect(screen.getAllByText('Ingresa la respuesta.')).toHaveLength(2);
    expect(screen.getByText(INVALID_DATA)).toBeTruthy();
    expect(complete).not.toHaveBeenCalled();
  });

  test('HU3-CA09, CA10: wrong answers show «Datos ingresados incorrectos» and keep the password', async () => {
    const { database, userId, catalog } = await setup();
    await startWith();
    await screen.findByTestId('recovery-challenge');
    await answerQuestions(catalog, 'Respuesta equivocada');
    await fillPasswords(NEW_PASSWORD);
    await update();
    expect(await screen.findByText(INVALID_DATA)).toBeTruthy();
    expect(screen.getByTestId('recovery-new-password').props.value).toBe('');
    expect(screen.getByTestId('recovery-answer-0').props.value).toBe('');
    await expect(passwordIs(database, userId, 'Clave123!')).resolves.toBe(true);
  });

  test('HU3-CA11 to CA13: correct answers update the password and return to the login form', async () => {
    const { database, userId, catalog, onNavigate } = await setup();
    await startWith();
    await screen.findByTestId('recovery-challenge');
    await answerQuestions(catalog);
    await fillPasswords(NEW_PASSWORD);
    await update();
    expect(
      await screen.findByText(
        'La contraseña fue actualizada. Inicia sesión con la nueva contraseña.',
      ),
    ).toBeTruthy();
    expect(onNavigate).not.toHaveBeenCalled();
    await acceptDialog();
    expect(onNavigate).toHaveBeenCalledWith('login');
    await expect(passwordIs(database, userId, NEW_PASSWORD)).resolves.toBe(
      true,
    );
    await expect(passwordIs(database, userId, 'Clave123!')).resolves.toBe(
      false,
    );
  });

  test('E05-D1: three wrong attempts lock the recovery and return to the identifier', async () => {
    const { catalog } = await setup();
    await startWith();
    await screen.findByTestId('recovery-challenge');
    for (let attempt = 0; attempt < 3; attempt++) {
      await answerQuestions(catalog, 'Respuesta equivocada');
      await fillPasswords(NEW_PASSWORD);
      await update();
      await screen.findByText(INVALID_DATA);
      await acceptDialog();
    }
    await answerQuestions(catalog);
    await fillPasswords(NEW_PASSWORD);
    await update();
    expect(
      await screen.findByText(
        'Superaste los intentos permitidos. La recuperación queda bloqueada durante 15 minutos.',
      ),
    ).toBeTruthy();
    await acceptDialog();
    expect(screen.queryByTestId('recovery-challenge')).toBeNull();
    await fireEvent.press(screen.getByTestId('recovery-start'));
    expect(
      await screen.findByText(
        'Superaste los intentos permitidos. La recuperación queda bloqueada durante 15 minutos.',
      ),
    ).toBeTruthy();
  });

  test('E05-D2: an expired challenge asks to start again', async () => {
    const { catalog, clock } = await setup();
    await startWith();
    await screen.findByTestId('recovery-challenge');
    clock.advance(RECOVERY_CHALLENGE_TTL_MS + MINUTE);
    await answerQuestions(catalog);
    await fillPasswords(NEW_PASSWORD);
    await update();
    expect(
      await screen.findByText(
        'El tiempo para responder las preguntas terminó. Comienza la recuperación de nuevo.',
      ),
    ).toBeTruthy();
    await acceptDialog();
    expect(screen.queryByTestId('recovery-challenge')).toBeNull();
    expect(screen.getByTestId('recovery-identifier').props.value).toBe(
      'ana@example.com',
    );
  });

  test('A-ID2: an ambiguous national number asks for the country code', async () => {
    const { database } = await setup();
    await createAccount(
      database,
      profile({
        documentNumber: '3003',
        email: 'eva@example.com',
        phoneCountryCode: '+1',
        phoneNumber: '3001112233',
      }),
    );
    await startWith('3001112233');
    expect(
      await screen.findByText(
        'Ingresa el número celular con el código de país',
      ),
    ).toBeTruthy();
  });

  test('a database failure shows a generic message', async () => {
    const gateway: RecoveryGateway = {
      listSecurityQuestions: async () => [],
      start: async () => ({ status: 'failed' }),
      complete: async () => ({ status: 'failed' }),
    };
    await setup(gateway);
    await startWith();
    expect(
      await screen.findByText(
        'No fue posible recuperar la contraseña. Intenta de nuevo',
      ),
    ).toBeTruthy();
  });

  test('E05-D6: the Android back button returns to the login form', async () => {
    const listeners: Array<Parameters<typeof BackHandler.addEventListener>[1]> =
      [];
    const spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listeners.push(handler);
        return { remove: jest.fn() };
      });
    const { onNavigate } = await setup();
    expect(listeners.at(-1)!({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(
      true,
    );
    expect(onNavigate).toHaveBeenCalledWith('login');
    spy.mockRestore();
  });
});

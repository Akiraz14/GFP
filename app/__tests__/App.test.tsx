import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import App from '../App';
import { DatabaseOpenError } from '../src/infrastructure/database/encryptedDatabase';
import { MigrationError } from '../src/infrastructure/database/migrator';
import { resolveRoute } from '../src/presentation/navigation/AppNavigator';
import {
  ROUTE_DEFINITIONS,
  type RouteName,
} from '../src/presentation/navigation/routes';
import { CategoryManagementService } from '../src/business/categories/categoryManagement';
import { MovementManagementService } from '../src/business/movements/movementManagement';
import { AccountLoginService } from '../src/services/authentication/accountLogin';
import { AccountRecoveryService } from '../src/services/authentication/accountRecovery';
import { AccountRegistrationService } from '../src/services/authentication/accountRegistration';
import { SessionManager } from '../src/services/session/sessionManager';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  DEFAULT_ANSWERS,
  profile,
  TEST_PARAMETERS,
} from '../testing/identityFixtures';

jest.mock('../src/services/nativeAppServices', () => ({
  createNativeAppServices: jest.fn(),
}));

jest.setTimeout(20_000);

async function readyServices(withAccount = false) {
  const database = await createMigratedDatabase();
  if (withAccount) {
    await createAccount(database, profile());
  }
  const sessions = new SessionManager(nodeRandomBytes);
  const dependencies = {
    database,
    engine: nodePbkdf2Engine,
    random: nodeRandomBytes,
    parameters: TEST_PARAMETERS,
  };
  return {
    registration: new AccountRegistrationService(dependencies),
    login: new AccountLoginService({ ...dependencies, sessions }),
    recovery: new AccountRecoveryService(dependencies),
    sessions,
    categories: new CategoryManagementService({
      database,
      sessions,
      random: nodeRandomBytes,
    }),
    movements: new MovementManagementService({
      database,
      sessions,
      random: nodeRandomBytes,
    }),
    database,
  };
}

describe('App startup and navigation (A-W9, G-07, HU2)', () => {
  test('opens the database at startup and starts in the HU2 login screen', async () => {
    const createServices = jest.fn(() => readyServices());
    await render(<App createServices={createServices} />);
    expect(screen.getByTestId('app-base')).toBeTruthy();
    expect(await screen.findByTestId('login-screen')).toBeTruthy();
    expect(screen.getByText('Iniciar sesión')).toBeTruthy();
    expect(createServices).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['a lost key', new DatabaseOpenError('key_lost')],
    ['a rejected key', new DatabaseOpenError('key_rejected')],
    ['missing SQLCipher', new DatabaseOpenError('cipher_unavailable')],
    ['a newer schema', new MigrationError('newer_schema', 9)],
    ['an unexpected error', new Error('boom')],
  ])(
    'blocks every database feature after %s and shows the approved message',
    async (_label, error) => {
      await render(<App createServices={() => Promise.reject(error)} />);
      expect(
        await screen.findByText(
          'No fue posible abrir la base de datos. Reinicia la aplicación.',
        ),
      ).toBeTruthy();
      expect(screen.queryByTestId('registration-wizard')).toBeNull();
      expect(screen.queryByTestId('login-screen')).toBeNull();
      expect(screen.queryByText(/soporte/i)).toBeNull();
    },
  );

  test('HU2-CA08: «Registrar» opens the registration wizard', async () => {
    await render(<App createServices={() => readyServices()} />);
    await fireEvent.press(await screen.findByTestId('login-register'));
    expect(await screen.findByText('Paso 1 de 3')).toBeTruthy();
  });

  test('HU1-CA18 regression: «Cancelar» returns to the HU2 login screen with empty fields', async () => {
    await render(<App createServices={() => readyServices()} />);
    await fireEvent.press(await screen.findByTestId('login-register'));
    await screen.findByText('Paso 1 de 3');
    await fireEvent.changeText(
      screen.getByTestId('registration-firstName'),
      'Ana',
    );
    await fireEvent.press(screen.getByTestId('registration-cancel'));
    expect(screen.getByTestId('login-screen')).toBeTruthy();
    expect(screen.queryByTestId('provisional-HU2')).toBeNull();
    expect(screen.getByTestId('login-identifier').props.value).toBe('');
    expect(screen.getByTestId('login-password').props.value).toBe('');
  });

  test('HU2-CA09: «Olvidé mi contraseña» opens the HU3 recovery form', async () => {
    await render(<App createServices={() => readyServices()} />);
    await fireEvent.press(await screen.findByTestId('login-forgot-password'));
    expect(screen.getByTestId('recovery-screen')).toBeTruthy();
    expect(screen.queryByTestId('provisional-HU3')).toBeNull();
  });

  test('HU3-CA12, CA13: after a successful recovery the app returns to the login form and the new password logs in', async () => {
    const services = await readyServices(true);
    const catalog = await services.recovery.listSecurityQuestions();
    await render(<App createServices={() => Promise.resolve(services)} />);
    await fireEvent.press(await screen.findByTestId('login-forgot-password'));
    await fireEvent.changeText(
      screen.getByTestId('recovery-identifier'),
      'ana@example.com',
    );
    await fireEvent.press(screen.getByTestId('recovery-start'));
    await screen.findByTestId('recovery-challenge');
    for (const index of [0, 1]) {
      const field = screen.getByTestId(`recovery-answer-${index}`);
      const questionId = catalog.find(
        question => question.prompt === field.props.accessibilityLabel,
      )!.id;
      await fireEvent.changeText(
        field,
        DEFAULT_ANSWERS.find(answer => answer.questionId === questionId)!
          .answer,
      );
    }
    await fireEvent.changeText(
      screen.getByTestId('recovery-new-password'),
      'Nueva clave 9#',
    );
    await fireEvent.changeText(
      screen.getByTestId('recovery-confirmation'),
      'Nueva clave 9#',
    );
    await fireEvent.press(screen.getByTestId('recovery-update'));
    await fireEvent.press(await screen.findByTestId('dialog-accept'));
    expect(screen.getByTestId('login-screen')).toBeTruthy();
    await fireEvent.changeText(
      screen.getByTestId('login-identifier'),
      'ana@example.com',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'Nueva clave 9#',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('provisional-HU5')).toBeTruthy();
  });

  test('HU2-CA07, CA10: a valid login opens the authenticated home route', async () => {
    await render(<App createServices={() => readyServices(true)} />);
    await fireEvent.changeText(
      await screen.findByTestId('login-identifier'),
      '1001',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'Clave123!',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('provisional-HU5')).toBeTruthy();
    expect(screen.queryByTestId('login-screen')).toBeNull();
  });

  test('HU2-CA10: routes with financial data need the active session', () => {
    const sessions = new SessionManager(nodeRandomBytes);
    const protectedRoutes = (
      Object.keys(ROUTE_DEFINITIONS) as RouteName[]
    ).filter(route => ROUTE_DEFINITIONS[route].requiresSession);
    expect(protectedRoutes).toEqual([
      'movementForm',
      'movementHistory',
      'receiptCapture',
      'categories',
      'financialAnalysis',
      'recommendations',
    ]);
    const first = sessions.start('user-1');
    for (const route of protectedRoutes) {
      expect(resolveRoute(route, null, null)).toBe('login');
      expect(resolveRoute(route, first, first)).toBe(route);
    }
    const second = sessions.start('user-2');
    expect(resolveRoute('movementHistory', first, second)).toBe('login');
    sessions.end();
    expect(resolveRoute('movementHistory', second, null)).toBe('login');
    expect(resolveRoute('register', null, null)).toBe('register');
    expect(resolveRoute('passwordRecovery', null, null)).toBe(
      'passwordRecovery',
    );
  });

  test('the route registry declares HU1 to HU10 and HU1, HU2, HU3, HU4 and HU8 are implemented', () => {
    const stories = Object.values(ROUTE_DEFINITIONS).map(route => route.story);
    expect(stories).toEqual([
      'HU1',
      'HU2',
      'HU3',
      'HU4',
      'HU5',
      'HU7',
      'HU8',
      'HU9',
      'HU10',
    ]);
    expect(
      Object.values(ROUTE_DEFINITIONS)
        .filter(route => route.implemented)
        .map(route => route.story),
    ).toEqual(['HU1', 'HU2', 'HU3', 'HU4', 'HU8']);
  });
});

describe('HU8 access from the history (E06-D4)', () => {
  test('after logging in, «Categorías» opens the categories screen and the Android back button returns', async () => {
    const listeners: Array<Parameters<typeof BackHandler.addEventListener>[1]> =
      [];
    const spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listeners.push(handler);
        return { remove: jest.fn() };
      });
    await render(<App createServices={() => readyServices(true)} />);
    await fireEvent.changeText(
      await screen.findByTestId('login-identifier'),
      '1001',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'Clave123!',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
    await fireEvent.press(await screen.findByTestId('open-categories'));
    expect(await screen.findByTestId('categories-screen')).toBeTruthy();
    expect(await screen.findByText('Alimentación')).toBeTruthy();
    await act(async () => {
      listeners.at(-1)!({ type: 'hardwareBackPress', timeStamp: 0 });
    });
    expect(screen.getByTestId('provisional-HU5')).toBeTruthy();
    spy.mockRestore();
  });
});

describe('HU4 access from the history (E07)', () => {
  async function loggedIn() {
    const services = await readyServices(true);
    await render(<App createServices={async () => services} />);
    await fireEvent.changeText(
      await screen.findByTestId('login-identifier'),
      '1001',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'Clave123!',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
    await fireEvent.press(await screen.findByTestId('open-movement-form'));
    expect(await screen.findByTestId('movement-form')).toBeTruthy();
    return services;
  }

  test('«Nuevo movimiento» opens the form; saving shows the confirmation and returns to the history', async () => {
    const { database } = await loggedIn();
    await fireEvent.press(await screen.findByTestId('movement-type-expense'));
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '45500');
    await fireEvent.press(screen.getByTestId('movement-category'));
    await fireEvent.press(screen.getByTestId('movement-category-option-food'));
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(
      await screen.findByText('El movimiento fue registrado exitosamente'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('movement-success-back'));
    expect(screen.getByTestId('provisional-HU5')).toBeTruthy();
    const stored = await database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(stored.rows[0]).toEqual({ total: 1 });
  });

  test('HU4-CA12: «Cancelar» returns to the history without saving', async () => {
    const { database } = await loggedIn();
    await fireEvent.changeText(
      await screen.findByTestId('movement-amount'),
      '1000',
    );
    await fireEvent.press(screen.getByTestId('movement-cancel'));
    expect(screen.getByTestId('provisional-HU5')).toBeTruthy();
    const stored = await database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(stored.rows[0]).toEqual({ total: 0 });
  });

  test('HU2-CA10: an expired session on the form returns to the login screen', async () => {
    const { sessions } = await loggedIn();
    await fireEvent.changeText(
      await screen.findByTestId('movement-amount'),
      '1000',
    );
    await fireEvent.press(screen.getByTestId('movement-category'));
    await fireEvent.press(screen.getByTestId('movement-category-option-food'));
    sessions.end();
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(await screen.findByTestId('login-screen')).toBeTruthy();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { DatabaseOpenError } from '../src/infrastructure/database/encryptedDatabase';
import { MigrationError } from '../src/infrastructure/database/migrator';
import { resolveRoute } from '../src/presentation/navigation/AppNavigator';
import {
  ROUTE_DEFINITIONS,
  type RouteName,
} from '../src/presentation/navigation/routes';
import { AccountLoginService } from '../src/services/authentication/accountLogin';
import { AccountRegistrationService } from '../src/services/authentication/accountRegistration';
import { SessionManager } from '../src/services/session/sessionManager';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
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
    sessions,
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

  test('HU2-CA09: «Olvidé mi contraseña» opens the provisional HU3 screen', async () => {
    await render(<App createServices={() => readyServices()} />);
    await fireEvent.press(await screen.findByTestId('login-forgot-password'));
    expect(screen.getByTestId('provisional-HU3')).toBeTruthy();
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

  test('the route registry declares HU1 to HU10 and HU1 and HU2 are implemented', () => {
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
    ).toEqual(['HU1', 'HU2']);
  });
});

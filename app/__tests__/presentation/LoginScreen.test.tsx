import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { LoginScreen } from '../../src/presentation/login/LoginScreen';
import {
  AccountLoginService,
  type LoginGateway,
  type LoginResult,
} from '../../src/services/authentication/accountLogin';
import { SessionManager } from '../../src/services/session/sessionManager';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
  TEST_PARAMETERS,
} from '../../testing/identityFixtures';

jest.setTimeout(20_000);

const INVALID = 'El campo identificación o contraseña son incorrectos';

async function setup(gateway?: LoginGateway) {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  const service =
    gateway ??
    new AccountLoginService({
      database,
      engine: nodePbkdf2Engine,
      sessions,
      random: nodeRandomBytes,
      parameters: TEST_PARAMETERS,
    });
  const onAuthenticated = jest.fn();
  const onNavigate = jest.fn();
  await render(
    <LoginScreen
      gateway={service}
      onAuthenticated={onAuthenticated}
      onNavigate={onNavigate}
    />,
  );
  return { userId, sessions, onAuthenticated, onNavigate };
}

async function type(testID: string, text: string) {
  await fireEvent.changeText(screen.getByTestId(testID), text);
}

async function submit() {
  await fireEvent.press(screen.getByTestId('login-submit'));
}

describe('HU2 login screen', () => {
  test('shows the HU2 fields, buttons and link with their literal names', async () => {
    await setup();
    expect(screen.getByText('Iniciar sesión')).toBeTruthy();
    expect(screen.getByLabelText('Identificador')).toBeTruthy();
    expect(
      screen.getByText(
        'Correo electrónico, número de documento o número de celular',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
    expect(screen.getByText('Ingresar')).toBeTruthy();
    expect(screen.getByText('Registrar')).toBeTruthy();
    expect(screen.getByText('Olvidé mi contraseña')).toBeTruthy();
  });

  test('HU2-CA03: the password field hides what is typed', async () => {
    await setup();
    expect(screen.getByTestId('login-password').props.secureTextEntry).toBe(
      true,
    );
  });

  test('HU2-CA02: identifier and password are required, next to each field', async () => {
    await setup();
    await submit();
    expect(screen.getByText('Ingresa tu identificador.')).toBeTruthy();
    expect(screen.getByText('Ingresa tu contraseña.')).toBeTruthy();
    await type('login-identifier', 'ana@example.com');
    expect(screen.queryByText('Ingresa tu identificador.')).toBeNull();
    expect(screen.getByText('Ingresa tu contraseña.')).toBeTruthy();
  });

  test('HU2-CA04: an e-mail without @ and a domain shows «Verificar identificación»', async () => {
    await setup();
    await type('login-identifier', 'ana@example');
    await type('login-password', 'Clave123!');
    await submit();
    expect(screen.getByText('Verificar identificación')).toBeTruthy();
    expect(screen.queryByTestId('dialog-login')).toBeNull();
  });

  test('HU2-CA05: wrong credentials show the literal alert and clear the password', async () => {
    await setup();
    await type('login-identifier', 'ana@example.com');
    await type('login-password', 'Incorrecta9!');
    await submit();
    expect(await screen.findByText(INVALID)).toBeTruthy();
    expect(screen.getByTestId('login-password').props.value).toBe('');
    expect(screen.getByTestId('login-identifier').props.value).toBe(
      'ana@example.com',
    );
    await fireEvent.press(screen.getByTestId('dialog-accept'));
    expect(screen.queryByTestId('dialog-login')).toBeNull();
  });

  test('HU2-CA06: the third failure announces the 15 minute lock and later attempts are blocked', async () => {
    await setup();
    for (let attempt = 0; attempt < 2; attempt++) {
      await type('login-identifier', 'ana@example.com');
      await type('login-password', 'Incorrecta9!');
      await submit();
      await screen.findByText(INVALID);
      await fireEvent.press(screen.getByTestId('dialog-accept'));
    }
    await type('login-password', 'Incorrecta9!');
    await submit();
    expect(
      await screen.findByText(
        `${INVALID}.\nSuperaste los intentos permitidos. El acceso queda bloqueado durante 15 minutos.`,
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('dialog-accept'));
    await type('login-password', 'Clave123!');
    await submit();
    expect(
      await screen.findByText(
        'Superaste los intentos permitidos. El acceso queda bloqueado durante 15 minutos.',
      ),
    ).toBeTruthy();
  });

  test('HU2-CA07: valid credentials authenticate against the database and clear the form', async () => {
    const { onAuthenticated, userId, sessions } = await setup();
    await type('login-identifier', '+57 300 111 2233');
    await type('login-password', 'Clave123!');
    await submit();
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    expect(onAuthenticated.mock.calls[0][0].userId).toBe(userId);
    expect(onAuthenticated.mock.calls[0][0]).toBe(sessions.current());
    expect(screen.getByTestId('login-password').props.value).toBe('');
  });

  test('A-ID2: an ambiguous national number asks for the country code next to the field', async () => {
    const result: LoginResult = { status: 'phone_country_code_required' };
    await setup({ login: () => Promise.resolve(result) });
    await type('login-identifier', '3001112233');
    await type('login-password', 'Clave123!');
    await submit();
    expect(
      screen.getByText('Ingresa el número celular con el código de país'),
    ).toBeTruthy();
  });

  test('a storage failure shows a generic message without details', async () => {
    await setup({ login: () => Promise.resolve({ status: 'failed' }) });
    await type('login-identifier', 'ana@example.com');
    await type('login-password', 'Clave123!');
    await submit();
    expect(
      screen.getByText('No fue posible iniciar sesión. Intenta de nuevo'),
    ).toBeTruthy();
  });

  test('while checking, the controls are disabled and a second press does nothing', async () => {
    let resolve: (result: LoginResult) => void = () => undefined;
    const login = jest.fn(
      () =>
        new Promise<LoginResult>(done => {
          resolve = done;
        }),
    );
    await setup({ login });
    await type('login-identifier', 'ana@example.com');
    await type('login-password', 'Clave123!');
    await submit();
    expect(screen.getByText('Ingresando…')).toBeTruthy();
    expect(screen.getByTestId('login-submit').props.accessibilityState).toEqual(
      {
        disabled: true,
      },
    );
    await submit();
    expect(login).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ status: 'failed' }));
    expect(screen.queryByText('Ingresando…')).toBeNull();
  });

  test('HU2-CA08: «Registrar» goes to the registration form', async () => {
    const { onNavigate } = await setup();
    await fireEvent.press(screen.getByTestId('login-register'));
    expect(onNavigate).toHaveBeenCalledWith('register');
  });

  test('HU2-CA09: «Olvidé mi contraseña» goes to the password recovery route', async () => {
    const { onNavigate } = await setup();
    await fireEvent.press(screen.getByTestId('login-forgot-password'));
    expect(onNavigate).toHaveBeenCalledWith('passwordRecovery');
  });
});

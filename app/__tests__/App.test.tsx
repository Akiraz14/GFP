import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { DatabaseOpenError } from '../src/infrastructure/database/encryptedDatabase';
import { MigrationError } from '../src/infrastructure/database/migrator';
import { ROUTE_DEFINITIONS } from '../src/presentation/navigation/routes';
import { AccountRegistrationService } from '../src/services/authentication/accountRegistration';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../testing/nodeSqliteDatabase';
import {
  createMigratedDatabase,
  TEST_PARAMETERS,
} from '../testing/identityFixtures';

jest.mock('../src/services/nativeAppServices', () => ({
  createNativeAppServices: jest.fn(),
}));

jest.setTimeout(20_000);

async function readyServices() {
  const database = await createMigratedDatabase();
  return {
    registration: new AccountRegistrationService({
      database,
      engine: nodePbkdf2Engine,
      random: nodeRandomBytes,
      parameters: TEST_PARAMETERS,
    }),
  };
}

describe('App startup and navigation (A-W9, G-07)', () => {
  test('opens the database at startup and starts in the registration wizard', async () => {
    const createServices = jest.fn(readyServices);
    await render(<App createServices={createServices} />);
    expect(screen.getByTestId('app-base')).toBeTruthy();
    expect(await screen.findByText('Paso 1 de 3')).toBeTruthy();
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
      expect(screen.queryByText(/soporte/i)).toBeNull();
    },
  );

  test('«Cancelar» leads to the provisional login screen of HU2', async () => {
    await render(<App createServices={readyServices} />);
    await screen.findByText('Paso 1 de 3');
    await fireEvent.press(screen.getByTestId('registration-cancel'));
    expect(screen.getByTestId('provisional-HU2')).toBeTruthy();
    expect(screen.getByText('Iniciar sesión')).toBeTruthy();
  });

  test('the route registry declares HU1 to HU10 and only HU1 is implemented', () => {
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
    ).toEqual(['HU1']);
  });
});

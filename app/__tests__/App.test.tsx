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
import { RecommendationService } from '../src/business/recommendations/recommendationService';
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
    receipts: fakeReceipts(),
    recommendations: new RecommendationService({ database, sessions }),
    database,
  };
}

// Cámara y OCR falsos (HU7): devuelven una foto válida y el texto de un comprobante.
function fakeReceipts(text = 'Tienda Sol\nFecha 20/10/2026\nTOTAL 45.500') {
  const image = {
    uri: 'file:///cache/rn_image_picker_lib_temp_1.jpg',
    fileName: 'rn_image_picker_lib_temp_1.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1000,
  };
  return {
    takePhoto: jest.fn(async () => image),
    pickFromGallery: jest.fn(async () => image),
    recognizeText: jest.fn(async () => text),
    discardImage: jest.fn(async () => {}),
  };
}

describe('App startup and navigation (A-W9, G-07, HU2)', () => {
  test('opens the database at startup and starts in the HU2 login screen', async () => {
    const createServices = jest.fn(() => readyServices());
    await render(<App createServices={createServices} />);
    expect(screen.getByTestId('app-base')).toBeTruthy();
    expect(await screen.findByTestId('login-screen')).toBeTruthy();
    expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
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

  test('HU2-CA09: «¿Olvidaste tu contraseña?» opens the HU3 recovery form', async () => {
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
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
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
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
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

  test('the route registry declares HU1 to HU10 and all of them are implemented', () => {
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
    ).toEqual(['HU1', 'HU2', 'HU3', 'HU4', 'HU5', 'HU7', 'HU8', 'HU9', 'HU10']);
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
    expect(screen.getByTestId('movement-history')).toBeTruthy();
    spy.mockRestore();
  });
});

describe('HU4 access from the history (E07, E08)', () => {
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
    expect(screen.getByTestId('movement-history')).toBeTruthy();
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
    expect(screen.getByTestId('movement-history')).toBeTruthy();
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

describe('HU5 history in the app (E08)', () => {
  async function loggedInWithMovement() {
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
    await fireEvent.changeText(
      await screen.findByTestId('movement-amount'),
      '45500',
    );
    await fireEvent.press(screen.getByTestId('movement-category'));
    await fireEvent.press(screen.getByTestId('movement-category-option-food'));
    await fireEvent.changeText(
      screen.getByTestId('movement-description'),
      'Almuerzo',
    );
    await fireEvent.press(screen.getByTestId('movement-save'));
    await fireEvent.press(await screen.findByTestId('movement-success-back'));
    await screen.findByText('Almuerzo');
    const stored = await services.database.execute('SELECT id FROM movements');
    return { services, id: stored.rows[0].id as string };
  }

  test('HU5-CA01: the registered movement appears in the history', async () => {
    const { id } = await loggedInWithMovement();
    expect(screen.getByTestId(`movement-amount-${id}`).props.children).toBe(
      '-$45.500,00',
    );
  });

  test('HU5-CA07, HU4-CA10, CA07, CA08: «Editar» loads the data, «Actualizar» saves it', async () => {
    const { services, id } = await loggedInWithMovement();
    await fireEvent.press(screen.getByTestId(`movement-edit-${id}`));
    expect(await screen.findByText('Editar movimiento')).toBeTruthy();
    expect(screen.getByTestId('movement-amount').props.value).toBe('45.500');
    expect(screen.getByTestId('movement-description').props.value).toBe(
      'Almuerzo',
    );
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '50000');
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(
      await screen.findByText('El movimiento fue actualizado exitosamente'),
    ).toBeTruthy();
    const stored = await services.database.execute(
      'SELECT amount_cents FROM movements WHERE id = ?',
      [id],
    );
    expect(stored.rows[0]).toEqual({ amount_cents: 5_000_000 });
    await fireEvent.press(screen.getByTestId('movement-cancel'));
    expect(
      (await screen.findByTestId(`movement-amount-${id}`)).props.children,
    ).toBe('-$50.000,00');
  });

  test('HU4-CA12: «Cancelar» on an edit discards the changes and returns to the history', async () => {
    const { services, id } = await loggedInWithMovement();
    await fireEvent.press(screen.getByTestId(`movement-edit-${id}`));
    await fireEvent.changeText(
      await screen.findByTestId('movement-amount'),
      '99999',
    );
    await fireEvent.press(screen.getByTestId('movement-cancel'));
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
    expect(screen.getByTestId(`movement-amount-${id}`).props.children).toBe(
      '-$45.500,00',
    );
    const stored = await services.database.execute(
      'SELECT amount_cents FROM movements WHERE id = ?',
      [id],
    );
    expect(stored.rows[0]).toEqual({ amount_cents: 4_550_000 });
  });

  test('HU8-CA08: a category created in HU8 is offered by the history filter', async () => {
    await loggedInWithMovement();
    await fireEvent.press(screen.getByTestId('open-categories'));
    await fireEvent.press(await screen.findByTestId('categories-new'));
    await fireEvent.changeText(
      await screen.findByTestId('category-name'),
      'Mascotas',
    );
    await fireEvent.press(screen.getByTestId('category-icon-pet'));
    await fireEvent.press(screen.getByTestId('category-save'));
    await screen.findByText('Mascotas');
    await fireEvent.press(screen.getByTestId('tab-movementHistory'));
    await fireEvent.press(await screen.findByTestId('history-category'));
    expect(await screen.findByText('Mascotas')).toBeTruthy();
  });

  test('E08-D4: the bottom bar opens HU9 and HU10 and returns to «Movimientos»', async () => {
    await loggedInWithMovement();
    await fireEvent.press(screen.getByTestId('tab-financialAnalysis'));
    expect(await screen.findByTestId('analysis-screen')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-recommendations'));
    expect(await screen.findByTestId('recommendations-screen')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-movementHistory'));
    expect(await screen.findByText('Almuerzo')).toBeTruthy();
  });

  test('HU9-CA04 and HU10: analysis and recommendations follow creating and deleting movements', async () => {
    const { id } = await loggedInWithMovement();
    await fireEvent.press(screen.getByTestId('tab-financialAnalysis'));
    expect((await screen.findByTestId('analysis-expense')).props.children).toBe(
      '$45.500,00',
    );
    await fireEvent.press(screen.getByTestId('tab-recommendations'));
    expect(await screen.findByTestId('recommendation-no-income')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-movementHistory'));
    await fireEvent.press(await screen.findByTestId(`movement-delete-${id}`));
    await fireEvent.press(screen.getByTestId('movement-delete-confirm'));
    await screen.findByTestId('history-deleted');
    await fireEvent.press(screen.getByTestId('tab-financialAnalysis'));
    expect(await screen.findByTestId('analysis-empty')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-recommendations'));
    expect(await screen.findByTestId('recommendations-empty')).toBeTruthy();
  });

  test('HU9 and HU10 links open the history with their filters', async () => {
    await loggedInWithMovement();
    await fireEvent.press(screen.getByTestId('tab-recommendations'));
    await fireEvent.press(
      await screen.findByTestId('recommendation-open-critical-category-food'),
    );
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
    expect(screen.getByTestId('history-from').props.value).toMatch(
      /^01\/\d{2}\/\d{4}$/,
    );
    expect(
      screen.getByTestId('history-category').props.accessibilityLabel,
    ).toBe('Categoría');
    // La pestaña «Movimientos» vuelve a abrir el historial sin filtros.
    await fireEvent.press(screen.getByTestId('tab-movementHistory'));
    expect(screen.getByTestId('history-from').props.value).toBe('');
  });

  test('HU2-CA10: after the session expires the history returns to the login screen', async () => {
    const { services } = await loggedInWithMovement();
    services.sessions.end();
    await fireEvent.press(screen.getByTestId('history-filter'));
    expect(await screen.findByTestId('login-screen')).toBeTruthy();
  });
});

describe('HU7 capture in the app', () => {
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
    await fireEvent.press(await screen.findByTestId('open-receipt-capture'));
    expect(screen.getByText('Movimiento con foto')).toBeTruthy();
    return services;
  }

  test('HU7-CA05, CA09, CA10: «Continuar» prefills HU4 as an expense and nothing is saved until confirmed', async () => {
    const services = await loggedIn();
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    await fireEvent.press(await screen.findByTestId('receipt-continue'));
    expect(await screen.findByTestId('movement-form')).toBeTruthy();
    expect(screen.getByTestId('movement-amount').props.value).toBe('45.500');
    expect(screen.getByTestId('movement-date').props.value).toBe('20/10/2026');
    expect(screen.getByTestId('movement-description').props.value).toBe(
      'Tienda Sol',
    );
    expect(
      screen.getByTestId('movement-type-expense').props.accessibilityState,
    ).toMatchObject({ selected: true });
    let stored = await services.database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(stored.rows[0]).toEqual({ total: 0 });
    // La foto temporal se borra al continuar (la imagen no se conserva).
    expect(services.receipts.discardImage).toHaveBeenCalledWith(
      'file:///cache/rn_image_picker_lib_temp_1.jpg',
    );
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '46000');
    await fireEvent.press(screen.getByTestId('movement-category'));
    await fireEvent.press(screen.getByTestId('movement-category-option-food'));
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(
      await screen.findByText('El movimiento fue registrado exitosamente'),
    ).toBeTruthy();
    stored = await services.database.execute(
      'SELECT amount_cents, description FROM movements',
    );
    expect(stored.rows[0]).toEqual({
      amount_cents: 4_600_000,
      description: 'Tienda Sol',
    });
  });

  test('HU7-CA12: «Cancelar» returns to the history and discards the photo', async () => {
    const services = await loggedIn();
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    await fireEvent.press(await screen.findByTestId('receipt-cancel'));
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
    expect(services.receipts.discardImage).toHaveBeenCalled();
  });
});

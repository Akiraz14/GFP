import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { CategoryManagementService } from '../../src/business/categories/categoryManagement';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import {
  MovementFormScreen,
  type MovementFormMode,
} from '../../src/presentation/movements/MovementFormScreen';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

// 24/10/2026 al mediodía, hora local.
const NOW = new Date(2026, 9, 24, 12, 0, 0).getTime();
const openPicker = DateTimePickerAndroid.open as jest.Mock;

async function setup(params: MovementFormMode = { mode: 'create' }) {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  const movements = new MovementManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
    now: () => NOW,
  });
  const categories = new CategoryManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
  });
  const session = sessions.start(userId);
  return { database, sessions, movements, categories, session, params };
}

type Context = Awaited<ReturnType<typeof setup>>;

async function show(context: Context, params = context.params) {
  const onDone = jest.fn();
  const onSessionExpired = jest.fn();
  await render(
    <MovementFormScreen
      categories={context.categories}
      movements={context.movements}
      now={() => NOW}
      onDone={onDone}
      onSessionExpired={onSessionExpired}
      params={params}
      session={context.session}
    />,
  );
  await screen.findByTestId('movement-amount');
  return { onDone, onSessionExpired };
}

async function chooseCategory(id: string) {
  await fireEvent.press(screen.getByTestId('movement-category'));
  await fireEvent.press(screen.getByTestId(`movement-category-option-${id}`));
}

function categoryOptions(): string[] {
  return screen
    .getAllByTestId(/^movement-category-option-/)
    .map(option =>
      option.props.testID.replace('movement-category-option-', ''),
    );
}

async function storedMovements(context: Context) {
  const result = await context.database.execute(
    'SELECT type, amount_cents, occurred_on, category_id, description FROM movements',
  );
  return result.rows;
}

beforeEach(() => openPicker.mockReset());

describe('HU4 form (create mode)', () => {
  test('shows the literal header, the type indicator and the buttons', async () => {
    await show(await setup());
    expect(screen.getByText('Registro de movimiento')).toBeTruthy();
    expect(screen.getByText('Añade una nueva transacción.')).toBeTruthy();
    expect(screen.getByTestId('movement-type-indicator-expense')).toBeTruthy();
    expect(screen.getByText('Guardar movimiento')).toBeTruthy();
    expect(screen.getByText('Limpiar')).toBeTruthy();
    expect(screen.getByText('Cancelar')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('movement-type-income'));
    expect(screen.getByTestId('movement-type-indicator-income')).toBeTruthy();
  });

  test('HU4-CA03: the date starts with today', async () => {
    await show(await setup());
    expect(screen.getByTestId('movement-date').props.value).toBe('24/10/2026');
  });

  test('HU4-CA02 and D-02: the categories come from the catalog filtered by type', async () => {
    const context = await setup();
    await context.categories.create(context.session, {
      name: 'Bonos',
      type: 'income',
      icon: 'gift',
    });
    await show(context);
    await fireEvent.press(screen.getByTestId('movement-category'));
    expect(categoryOptions()).toEqual([
      'food',
      'transport',
      'housing',
      'entertainment',
      'health',
      'education',
      'shopping',
      'other',
    ]);
    await fireEvent.press(screen.getByTestId('movement-category-option-food'));
    await fireEvent.press(screen.getByTestId('movement-type-income'));
    await fireEvent.press(screen.getByTestId('movement-category'));
    expect(categoryOptions()).toEqual(['salary', 'other', expect.any(String)]);
    expect(
      within(screen.getByTestId('movement-category-options')).getByText(
        'Bonos',
      ),
    ).toBeTruthy();
  });

  test('D-02: changing the type clears an incompatible category and keeps «Otros»', async () => {
    await show(await setup());
    await chooseCategory('food');
    await fireEvent.press(screen.getByTestId('movement-type-income'));
    expect(
      within(screen.getByTestId('movement-category')).getByText(
        'Selecciona una categoría',
      ),
    ).toBeTruthy();
    await chooseCategory('other');
    await fireEvent.press(screen.getByTestId('movement-type-expense'));
    expect(
      within(screen.getByTestId('movement-category')).getByText('Otros'),
    ).toBeTruthy();
  });

  test('HU4-CA07, CA08, CA09: saving stores the movement, confirms it and clears the form', async () => {
    const context = await setup();
    const { onDone } = await show(context);
    await fireEvent.press(screen.getByTestId('movement-type-income'));
    await fireEvent.changeText(
      screen.getByTestId('movement-amount'),
      '1.250.000,50',
    );
    await fireEvent.changeText(
      screen.getByTestId('movement-date'),
      '01/10/2026',
    );
    await chooseCategory('salary');
    await fireEvent.changeText(
      screen.getByTestId('movement-description'),
      'Pago de octubre',
    );
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(await screen.findByText('¡Operación exitosa!')).toBeTruthy();
    expect(
      screen.getByText('El movimiento fue registrado exitosamente'),
    ).toBeTruthy();
    const summary = screen.getByTestId('movement-success-summary');
    expect(within(summary).getByText('$1.250.000,50')).toBeTruthy();
    expect(within(summary).getByText('Ingreso · Salario')).toBeTruthy();
    expect(within(summary).getByText('01/10/2026')).toBeTruthy();
    expect(within(summary).getByText('Pago de octubre')).toBeTruthy();
    expect(await storedMovements(context)).toEqual([
      {
        type: 'income',
        amount_cents: 125_000_050,
        occurred_on: '2026-10-01',
        category_id: 'salary',
        description: 'Pago de octubre',
      },
    ]);
    await fireEvent.press(screen.getByTestId('movement-success-back'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('HU4-CA01 and CA13: missing required fields show the literal error and save nothing', async () => {
    const context = await setup();
    await show(context);
    await fireEvent.changeText(screen.getByTestId('movement-date'), '');
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(screen.getByTestId('movement-form-error').props.children).toBe(
      'Error en los campos ingresados',
    );
    expect(screen.getByText('Ingrese un monto válido')).toBeTruthy();
    expect(screen.getByText('Ingresa la fecha')).toBeTruthy();
    expect(screen.getByTestId('movement-category-error').props.children).toBe(
      'Selecciona una categoría',
    );
    expect(await storedMovements(context)).toEqual([]);
  });

  test('HU4-CA04: a future date shows «La fecha no puede ser futura»', async () => {
    const context = await setup();
    await show(context);
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '1000');
    await chooseCategory('food');
    await fireEvent.changeText(
      screen.getByTestId('movement-date'),
      '25/10/2026',
    );
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(screen.getByTestId('movement-date-error').props.children).toBe(
      'La fecha no puede ser futura',
    );
    expect(screen.getByTestId('movement-form-error')).toBeTruthy();
    expect(await storedMovements(context)).toEqual([]);
  });

  test('HU4-CA05: a non positive amount shows «Ingrese un monto válido» next to the field', async () => {
    const context = await setup();
    await show(context);
    await chooseCategory('food');
    // Con la máscara (Bug 40) no se pueden escribir signos ni letras: lo que queda es un
    // monto vacío o cero.
    for (const amount of ['0', '000', 'abc', '']) {
      await fireEvent.changeText(screen.getByTestId('movement-amount'), amount);
      expect(screen.getByTestId('movement-amount').props.value).toBe('');
      await fireEvent.press(screen.getByTestId('movement-save'));
      expect(screen.getByTestId('movement-amount-error').props.children).toBe(
        'Ingrese un monto válido',
      );
    }
    expect(await storedMovements(context)).toEqual([]);
  });

  test('Bug 40 and Task 37: the amount is typed continuously with its decimals', async () => {
    const context = await setup();
    await show(context);
    const field = () => screen.getByTestId('movement-amount');
    expect(field().props.keyboardType).toBe('number-pad');
    let typed = '';
    for (const key of '4550075') {
      typed = field().props.value + key;
      await fireEvent.changeText(field(), typed);
    }
    expect(field().props.value).toBe('45.500,75');
    // El cursor queda siempre al final: no hace falta moverlo para los decimales.
    expect(field().props.selection).toEqual({ start: 9, end: 9 });
    await fireEvent.changeText(field(), '45.500,7');
    expect(field().props.value).toBe('4.550,07');
    await chooseCategory('food');
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(await screen.findByTestId('movement-success')).toBeTruthy();
    expect(
      within(screen.getByTestId('movement-success-summary')).getByText(
        '$4.550,07',
      ),
    ).toBeTruthy();
    expect((await storedMovements(context))[0].amount_cents).toBe(455_007);
  });

  test('HU4-CA06: the description is optional and limited to 250 characters', async () => {
    const context = await setup();
    await show(context);
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '1000');
    await chooseCategory('food');
    await fireEvent.changeText(
      screen.getByTestId('movement-description'),
      'x'.repeat(251),
    );
    expect(
      screen.getByTestId('movement-description-counter').props.children,
    ).toBe('251/250');
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(screen.getByTestId('movement-description-error')).toBeTruthy();
    expect(await storedMovements(context)).toEqual([]);
    await fireEvent.changeText(screen.getByTestId('movement-description'), '');
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(await screen.findByTestId('movement-success')).toBeTruthy();
    expect((await storedMovements(context))[0].description).toBeNull();
  });

  test('HU4-CA11: «Limpiar» restores every field', async () => {
    await show(await setup());
    await fireEvent.press(screen.getByTestId('movement-type-income'));
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '1000');
    await fireEvent.changeText(
      screen.getByTestId('movement-date'),
      '01/10/2026',
    );
    await chooseCategory('salary');
    await fireEvent.changeText(screen.getByTestId('movement-description'), 'x');
    await fireEvent.changeText(screen.getByTestId('movement-amount'), 'abc');
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(screen.getByTestId('movement-form-error')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('movement-clear'));
    expect(screen.getByTestId('movement-amount').props.value).toBe('');
    expect(screen.getByTestId('movement-date').props.value).toBe('24/10/2026');
    expect(screen.getByTestId('movement-description').props.value).toBe('');
    expect(screen.getByTestId('movement-type-indicator-expense')).toBeTruthy();
    expect(screen.queryByTestId('movement-form-error')).toBeNull();
    expect(screen.queryByTestId('movement-amount-error')).toBeNull();
    expect(
      within(screen.getByTestId('movement-category')).getByText(
        'Selecciona una categoría',
      ),
    ).toBeTruthy();
  });

  test('HU4-CA12: «Cancelar» and the Android back button leave without saving', async () => {
    const listeners: Array<Parameters<typeof BackHandler.addEventListener>[1]> =
      [];
    const spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listeners.push(handler);
        return { remove: jest.fn() };
      });
    const context = await setup();
    const { onDone } = await show(context);
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '1000');
    await fireEvent.press(screen.getByTestId('movement-cancel'));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(listeners.at(-1)!({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(
      true,
    );
    expect(onDone).toHaveBeenCalledTimes(2);
    expect(await storedMovements(context)).toEqual([]);
    spy.mockRestore();
  });

  test('D-03: the calendar opens with today as maximum and fills the date', async () => {
    openPicker.mockImplementation(options => {
      options.onValueChange({}, new Date(2026, 9, 3));
    });
    await show(await setup());
    await act(async () => {
      fireEvent.press(screen.getByTestId('movement-date-calendar'));
    });
    const options = openPicker.mock.calls[0][0];
    expect(options.mode).toBe('date');
    expect(options.maximumDate).toEqual(new Date(2026, 9, 24));
    expect(options.value).toEqual(new Date(2026, 9, 24));
    expect(screen.getByTestId('movement-date').props.value).toBe('03/10/2026');
  });

  test('D-03: closing the calendar keeps the typed date', async () => {
    openPicker.mockImplementation(options => options.onDismiss());
    await show(await setup());
    await fireEvent.changeText(
      screen.getByTestId('movement-date'),
      '05/09/2026',
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('movement-date-calendar'));
    });
    expect(openPicker.mock.calls[0][0].value).toEqual(new Date(2026, 8, 5));
    expect(screen.getByTestId('movement-date').props.value).toBe('05/09/2026');
  });

  test('HU2-CA10: an expired session leaves the form', async () => {
    const context = await setup();
    const { onSessionExpired } = await show(context);
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '1000');
    await chooseCategory('food');
    context.sessions.end();
    await fireEvent.press(screen.getByTestId('movement-save'));
    await act(async () => {});
    expect(onSessionExpired).toHaveBeenCalled();
    expect(await storedMovements(context)).toEqual([]);
  });
});

describe('HU4 form (edit mode; the HU5 entry point arrives in E08)', () => {
  async function withMovement() {
    const context = await setup();
    const saved = await context.movements.create(context.session, {
      type: 'expense',
      amount: '45.500',
      date: '20/10/2026',
      categoryId: 'food',
      description: 'Almuerzo',
    });
    if (saved.status !== 'saved') {
      throw new Error(saved.status);
    }
    return { context, id: saved.movement.id };
  }

  test('HU4-CA10: loads every stored field', async () => {
    const { context, id } = await withMovement();
    await show(context, { mode: 'edit', movementId: id });
    expect(screen.getByText('Editar movimiento')).toBeTruthy();
    expect(screen.getByTestId('movement-amount').props.value).toBe('45.500,00');
    expect(screen.getByTestId('movement-date').props.value).toBe('20/10/2026');
    expect(
      within(screen.getByTestId('movement-category')).getByText('Alimentación'),
    ).toBeTruthy();
    expect(screen.getByTestId('movement-description').props.value).toBe(
      'Almuerzo',
    );
    expect(screen.getByText('Actualizar')).toBeTruthy();
    expect(screen.queryByTestId('movement-clear')).toBeNull();
  });

  test('HU4-CA07 and CA08: «Actualizar» saves and shows the update message', async () => {
    const { context, id } = await withMovement();
    await show(context, { mode: 'edit', movementId: id });
    await fireEvent.changeText(
      screen.getByTestId('movement-amount'),
      '5000000',
    );
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(
      await screen.findByText('El movimiento fue actualizado exitosamente'),
    ).toBeTruthy();
    expect((await storedMovements(context))[0].amount_cents).toBe(5_000_000);
  });

  test('a missing movement shows a message and returns', async () => {
    const context = await setup();
    const { onDone } = await show(context, {
      mode: 'edit',
      movementId: 'missing',
    });
    const dialog = await screen.findByTestId('movement-dialog');
    expect(
      within(dialog).getByText('El movimiento ya no existe.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('movement-dialog-accept'));
    expect(onDone).toHaveBeenCalled();
  });
});

describe('HU4 form prefilled from HU7', () => {
  test('HU7-CA07 and CA09: loads only the detected data as an expense and warns', async () => {
    const context = await setup();
    await show(context, {
      mode: 'create',
      prefill: { amount: '45.500,00', date: '', description: 'Tienda Sol' },
    });
    expect(screen.getByTestId('movement-amount').props.value).toBe('45.500,00');
    expect(screen.getByTestId('movement-date').props.value).toBe('');
    expect(screen.getByTestId('movement-description').props.value).toBe(
      'Tienda Sol',
    );
    expect(screen.getByTestId('movement-type-indicator-expense')).toBeTruthy();
    expect(screen.getByTestId('movement-prefill-note').props.children).toBe(
      'No fue posible identificar toda la información. Complete los datos manualmente',
    );
    expect(await storedMovements(context)).toEqual([]);
  });

  test('HU7-CA08: without data every field is empty and the type is Gasto', async () => {
    await show(await setup(), {
      mode: 'create',
      prefill: { amount: '', date: '', description: '' },
    });
    expect(screen.getByTestId('movement-amount').props.value).toBe('');
    expect(screen.getByTestId('movement-date').props.value).toBe('');
    expect(screen.getByTestId('movement-description').props.value).toBe('');
    expect(screen.getByTestId('movement-type-indicator-expense')).toBeTruthy();
  });

  test('a complete reading shows no warning', async () => {
    await show(await setup(), {
      mode: 'create',
      prefill: {
        amount: '45.500,00',
        date: '20/10/2026',
        description: 'Tienda Sol',
      },
    });
    expect(screen.queryByTestId('movement-prefill-note')).toBeNull();
  });
});

describe('Task 31: amount guidance', () => {
  test('the amount explains that the last two digits are the cents', async () => {
    await show(await setup());
    expect(screen.getByTestId('movement-amount-help')).toHaveTextContent(
      'Escribe solo números: los dos últimos son los centavos.',
    );
  });
});

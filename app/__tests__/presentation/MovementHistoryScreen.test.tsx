import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import { CategoryManagementService } from '../../src/business/categories/categoryManagement';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import type { MovementInput } from '../../src/business/movements/movementRules';
import { MovementHistoryScreen } from '../../src/presentation/movements/MovementHistoryScreen';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

// 24/10/2026 al mediodía, hora local.
const NOW = new Date(2026, 9, 24, 12, 0, 0).getTime();

async function setup() {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  let clock = NOW;
  const movements = new MovementManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
    now: () => clock++,
  });
  const categories = new CategoryManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
  });
  const session = sessions.start(userId);
  const add = async (input: Partial<MovementInput>) => {
    const result = await movements.create(session, {
      type: 'expense',
      amount: '15.500',
      date: '20/10/2026',
      categoryId: 'food',
      description: '',
      ...input,
    });
    if (result.status !== 'saved') {
      throw new Error(result.status);
    }
    return result.movement.id;
  };
  return { database, sessions, movements, categories, session, add };
}

type Context = Awaited<ReturnType<typeof setup>>;

async function show(context: Context) {
  const callbacks = {
    onNewMovement: jest.fn(),
    onEdit: jest.fn(),
    onOpenCategories: jest.fn(),
    onSessionExpired: jest.fn(),
  };
  await render(
    <MovementHistoryScreen
      categories={context.categories}
      movements={context.movements}
      now={() => NOW}
      session={context.session}
      {...callbacks}
    />,
  );
  await act(async () => {});
  return callbacks;
}

function rowDescriptions(): string[] {
  return screen
    .queryAllByTestId(/^movement-row-/)
    .map(row => row.props.testID as string);
}

async function choose(select: string, option: string) {
  await fireEvent.press(screen.getByTestId(select));
  await fireEvent.press(screen.getByTestId(`${select}-option-${option}`));
}

async function pressFilter() {
  await fireEvent.press(screen.getByTestId('history-filter'));
  await act(async () => {});
}

describe('HU5 history screen', () => {
  test('shows the literal header and the empty state without movements', async () => {
    await show(await setup());
    expect(screen.getByText('Historial')).toBeTruthy();
    expect(screen.getByText('Movimientos de tus finanzas')).toBeTruthy();
    expect(
      within(screen.getByTestId('history-empty')).getByText(
        'No hay movimientos registrados',
      ),
    ).toBeTruthy();
  });

  test('HU5-CA01: lists the movements from the most recent, with sign, category and date', async () => {
    const context = await setup();
    const old = await context.add({ date: '01/09/2026', description: 'Viejo' });
    const salary = await context.add({
      type: 'income',
      amount: '1.200.000',
      date: '23/10/2026',
      categoryId: 'salary',
      description: 'Nómina',
    });
    const lunch = await context.add({ date: '24/10/2026' });
    await show(context);
    expect(rowDescriptions()).toEqual([
      `movement-row-${lunch}`,
      `movement-row-${salary}`,
      `movement-row-${old}`,
    ]);
    const salaryRow = screen.getByTestId(`movement-row-${salary}`);
    expect(within(salaryRow).getByText('+$1.200.000,00')).toBeTruthy();
    expect(within(salaryRow).getByText('SALARIO')).toBeTruthy();
    expect(within(salaryRow).getByText('Nómina')).toBeTruthy();
    expect(within(salaryRow).getByText(/23\/10\/2026 •/)).toBeTruthy();
    const lunchRow = screen.getByTestId(`movement-row-${lunch}`);
    expect(within(lunchRow).getByText('-$15.500,00')).toBeTruthy();
    // Sin descripción, la tarjeta muestra el nombre de la categoría.
    expect(within(lunchRow).getByText('Alimentación')).toBeTruthy();
  });

  test('HU5-CA02 and HU8-CA08: the category filter lists the catalog, including own categories', async () => {
    const context = await setup();
    await context.categories.create(context.session, {
      name: 'Mascotas',
      type: 'expense',
      icon: 'pet',
    });
    await show(context);
    await fireEvent.press(screen.getByTestId('history-category'));
    const options = within(
      screen.getByTestId('history-category-options'),
    ).getAllByText(/./);
    const labels = options.map(option => option.props.children);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Categoría (Todas)',
        'Alimentación',
        'Salario',
        'Otros',
        'Mascotas',
      ]),
    );
  });

  test('HU5-CA03: «Filtrar» applies every filter at the same time', async () => {
    const context = await setup();
    const inRange = await context.add({ date: '10/10/2026' });
    await context.add({ date: '01/09/2026' });
    await context.add({
      date: '10/10/2026',
      categoryId: 'transport',
    });
    await context.add({
      type: 'income',
      date: '10/10/2026',
      categoryId: 'salary',
    });
    await show(context);
    expect(rowDescriptions()).toHaveLength(4);
    await fireEvent.changeText(
      screen.getByTestId('history-from'),
      '01/10/2026',
    );
    await fireEvent.changeText(screen.getByTestId('history-to'), '31/10/2026');
    await choose('history-type', 'expense');
    await choose('history-category', 'food');
    // Sin pulsar «Filtrar» la lista no cambia.
    expect(rowDescriptions()).toHaveLength(4);
    await pressFilter();
    expect(rowDescriptions()).toEqual([`movement-row-${inRange}`]);
  });

  test('HU5-CA04: no matches show the literal empty state; «Limpiar filtros» shows everything', async () => {
    const context = await setup();
    await context.add({});
    await show(context);
    await choose('history-type', 'income');
    await pressFilter();
    const empty = screen.getByTestId('history-empty');
    expect(
      within(empty).getByText('No se encontraron movimientos'),
    ).toBeTruthy();
    expect(
      within(empty).getByText(
        'Intenta cambiar los filtros seleccionados o realiza otra búsqueda',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('history-clear-filters'));
    await act(async () => {});
    expect(rowDescriptions()).toHaveLength(1);
    expect(
      within(screen.getByTestId('history-type')).getByText('Todos los tipos'),
    ).toBeTruthy();
  });

  test('E08-D3: an invalid or inverted range is reported and does not filter', async () => {
    const context = await setup();
    await context.add({});
    await show(context);
    await fireEvent.changeText(
      screen.getByTestId('history-from'),
      '15/10/2026',
    );
    await fireEvent.changeText(screen.getByTestId('history-to'), '14/10/2026');
    await pressFilter();
    expect(screen.getByTestId('history-to-error').props.children).toBe(
      'La fecha fin no puede ser anterior a la fecha inicio',
    );
    await fireEvent.changeText(screen.getByTestId('history-to'), '31/02/2026');
    await pressFilter();
    expect(screen.getByTestId('history-to-error').props.children).toBe(
      'Ingresa una fecha válida con el formato DD/MM/AAAA',
    );
    expect(rowDescriptions()).toHaveLength(1);
  });

  test('HU5-CA05: «Eliminar» asks with the literal texts; «Cancelar» keeps the movement', async () => {
    const context = await setup();
    const id = await context.add({});
    await show(context);
    await fireEvent.press(screen.getByTestId(`movement-delete-${id}`));
    const dialog = screen.getByTestId('movement-delete-dialog');
    expect(
      within(dialog).getByText(
        '¿Está seguro de eliminar este movimiento?\n\nEsta acción es irreversible y afectará su balance.',
      ),
    ).toBeTruthy();
    expect(within(dialog).getByText('Cancelar')).toBeTruthy();
    expect(within(dialog).getByText('Confirmar')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('movement-delete-cancel'));
    expect(screen.queryByTestId('movement-delete-dialog')).toBeNull();
    expect(rowDescriptions()).toHaveLength(1);
  });

  test('HU5-CA06: «Confirmar» deletes, refreshes the list with the filters and confirms', async () => {
    const context = await setup();
    const first = await context.add({ date: '10/10/2026' });
    const second = await context.add({ date: '11/10/2026' });
    await context.add({ type: 'income', categoryId: 'salary' });
    await show(context);
    await choose('history-type', 'expense');
    await pressFilter();
    await fireEvent.press(screen.getByTestId(`movement-delete-${second}`));
    await fireEvent.press(screen.getByTestId('movement-delete-confirm'));
    await act(async () => {});
    expect(screen.getByTestId('history-deleted')).toBeTruthy();
    expect(
      screen.getByText('✓ Movimiento eliminado correctamente'),
    ).toBeTruthy();
    expect(rowDescriptions()).toEqual([`movement-row-${first}`]);
    const stored = await context.database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(stored.rows[0]).toEqual({ total: 2 });
  });

  test('HU5-CA07: «Editar» opens HU4 with the selected movement', async () => {
    const context = await setup();
    const id = await context.add({});
    const { onEdit } = await show(context);
    await fireEvent.press(screen.getByTestId(`movement-edit-${id}`));
    expect(onEdit).toHaveBeenCalledWith(id);
  });

  test('«Nuevo movimiento» and «Categorías» open their screens', async () => {
    const { onNewMovement, onOpenCategories } = await show(await setup());
    await fireEvent.press(screen.getByTestId('open-movement-form'));
    await fireEvent.press(screen.getByTestId('open-categories'));
    expect(onNewMovement).toHaveBeenCalledTimes(1);
    expect(onOpenCategories).toHaveBeenCalledTimes(1);
  });

  test('HU6-CA01 to CA03: the summary shows every movement with the Colombian format', async () => {
    const context = await setup();
    await context.add({
      type: 'income',
      amount: '1.200.350',
      categoryId: 'salary',
    });
    await context.add({ amount: '650.000' });
    await show(context);
    expect(screen.getByTestId('balance-income').props.children).toBe(
      '$1.200.350,00',
    );
    expect(screen.getByTestId('balance-expense').props.children).toBe(
      '$650.000,00',
    );
    expect(screen.getByTestId('balance-total').props.children).toBe(
      '$550.350,00',
    );
    // Los filtros del historial no cambian el resumen (plan aprobado).
    await choose('history-type', 'expense');
    await pressFilter();
    expect(screen.getByTestId('balance-income').props.children).toBe(
      '$1.200.350,00',
    );
  });

  test('HU6-CA03: a negative balance is red; HU6-CA04: deleting recalculates it', async () => {
    const context = await setup();
    const salary = await context.add({
      type: 'income',
      amount: '100.000',
      categoryId: 'salary',
    });
    await context.add({ amount: '150.000' });
    await show(context);
    const total = screen.getByTestId('balance-total');
    expect(total.props.children).toBe('-$50.000,00');
    expect(total.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#B3261E' })]),
    );
    await fireEvent.press(screen.getByTestId(`movement-delete-${salary}`));
    await fireEvent.press(screen.getByTestId('movement-delete-confirm'));
    await act(async () => {});
    expect(screen.getByTestId('balance-income').props.children).toBe('$0,00');
    expect(screen.getByTestId('balance-total').props.children).toBe(
      '-$150.000,00',
    );
  });

  test('opens with the filters given by HU9 or HU10', async () => {
    const context = await setup();
    const food = await context.add({ date: '10/10/2026' });
    await context.add({ date: '10/10/2026', categoryId: 'transport' });
    await render(
      <MovementHistoryScreen
        categories={context.categories}
        initialFilters={{
          from: '2026-10-01',
          to: '2026-10-31',
          type: 'expense',
          categoryId: 'food',
        }}
        movements={context.movements}
        now={() => NOW}
        onEdit={jest.fn()}
        onNewMovement={jest.fn()}
        onOpenCategories={jest.fn()}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    await act(async () => {});
    expect(rowDescriptions()).toEqual([`movement-row-${food}`]);
    expect(screen.getByTestId('history-from').props.value).toBe('01/10/2026');
  });

  test('HU2-CA10: an expired session leaves the history without deleting', async () => {
    const context = await setup();
    const id = await context.add({});
    const { onSessionExpired } = await show(context);
    context.sessions.end();
    await fireEvent.press(screen.getByTestId(`movement-delete-${id}`));
    await fireEvent.press(screen.getByTestId('movement-delete-confirm'));
    await act(async () => {});
    expect(onSessionExpired).toHaveBeenCalled();
    const stored = await context.database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(stored.rows[0]).toEqual({ total: 1 });
  });
});

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
import { CategoriesScreen } from '../../src/presentation/categories/CategoriesScreen';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const SYSTEM_IDS = [
  'food',
  'transport',
  'housing',
  'entertainment',
  'health',
  'education',
  'shopping',
  'salary',
  'other',
];

async function setup() {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  const service = new CategoryManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
  });
  const session = sessions.start(userId);
  const onBack = jest.fn();
  const onSessionExpired = jest.fn();
  await render(
    <CategoriesScreen
      gateway={service}
      onBack={onBack}
      onSessionExpired={onSessionExpired}
      session={session}
    />,
  );
  await screen.findByTestId('category-row-food');
  return { database, service, sessions, session, onBack, onSessionExpired };
}

async function fillForm(
  name: string,
  type: 'income' | 'expense',
  icon: string,
) {
  await fireEvent.changeText(screen.getByTestId('category-name'), name);
  await fireEvent.press(screen.getByTestId(`category-type-${type}`));
  await fireEvent.press(screen.getByTestId(`category-icon-${icon}`));
}

async function createFromScreen(
  name: string,
  type: 'income' | 'expense' = 'expense',
  icon = 'pet',
) {
  await fireEvent.press(screen.getByTestId('categories-new'));
  await fillForm(name, type, icon);
  await fireEvent.press(screen.getByTestId('category-save'));
  await screen.findByText(name);
}

function ownRowId(name: string): string {
  const row = screen
    .getAllByTestId(/^category-row-/)
    .find(element => within(element).queryByText(name) !== null);
  if (row === undefined) {
    throw new Error(`row ${name} not found`);
  }
  return String(row.props.testID).replace('category-row-', '');
}

describe('HU8 categories screen', () => {
  test('shows the literal header, sections and the 9 system categories', async () => {
    await setup();
    expect(screen.getByText('Categorías')).toBeTruthy();
    expect(
      screen.getByText('Gestiona tus etiquetas de ingresos y gastos'),
    ).toBeTruthy();
    expect(screen.getByText('+ Nueva categoría')).toBeTruthy();
    expect(screen.getByText('Categorías del sistema')).toBeTruthy();
    expect(screen.getByText('Mis categorías')).toBeTruthy();
    for (const name of [
      'Alimentación',
      'Transporte',
      'Vivienda',
      'Entretenimiento',
      'Salud',
      'Educación',
      'Compras',
      'Salario',
      'Otros',
    ]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  test('HU8-CA02: system rows show a lock and no edit or delete buttons', async () => {
    await setup();
    for (const id of SYSTEM_IDS) {
      expect(screen.getByTestId(`category-lock-${id}`)).toBeTruthy();
      expect(screen.queryByTestId(`category-edit-${id}`)).toBeNull();
      expect(screen.queryByTestId(`category-delete-${id}`)).toBeNull();
    }
  });

  test('HU8-CA03: creates a category with name, type and icon', async () => {
    await setup();
    expect(screen.queryAllByTestId(/^category-edit-/)).toEqual([]);
    expect(
      screen.queryByText('Aún no tienes categorías personalizadas.'),
    ).toBeNull();
    await fireEvent.press(screen.getByTestId('categories-new'));
    expect(screen.getByText('Nueva categoría')).toBeTruthy();
    expect(screen.getByText('Nombre de la categoría')).toBeTruthy();
    expect(screen.getByText('Tipo de categoría')).toBeTruthy();
    expect(screen.getByText('Ícono')).toBeTruthy();
    await fillForm('Freelance', 'income', 'briefcase');
    await fireEvent.press(screen.getByTestId('category-save'));
    expect(await screen.findByText('Freelance')).toBeTruthy();
    expect(screen.queryByTestId('category-form')).toBeNull();
    const id = ownRowId('Freelance');
    expect(screen.getByTestId(`category-edit-${id}`)).toBeTruthy();
    expect(screen.getByTestId(`category-delete-${id}`)).toBeTruthy();
  });

  test('E06-D6c: «Guardar» stays disabled until the name and the icon are given', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('categories-new'));
    const disabled = () =>
      screen.getByTestId('category-save').props.accessibilityState.disabled;
    expect(screen.getByText('Guardar')).toBeTruthy();
    expect(disabled()).toBe(true);
    await fireEvent.changeText(screen.getByTestId('category-name'), '   ');
    await fireEvent.press(screen.getByTestId('category-icon-pet'));
    expect(disabled()).toBe(true);
    await fireEvent.changeText(screen.getByTestId('category-name'), 'Viajes');
    await act(async () => {});
    expect(disabled()).toBe(false);
    expect(screen.queryByText('Ingresa el nombre de la categoría.')).toBeNull();
  });

  test('E06-D5: the selector offers the 12 icons of the prototype', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('categories-new'));
    expect(
      screen
        .getAllByTestId(/^category-icon-/)
        .map(element =>
          String(element.props.testID).replace('category-icon-', ''),
        ),
    ).toEqual([
      'cart',
      'home',
      'car',
      'food',
      'heart',
      'book',
      'gift',
      'pet',
      'dumbbell',
      'briefcase',
      'plane',
      'more',
    ]);
  });

  test('E06-D9b: the name field accepts at most 40 characters', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('categories-new'));
    expect(screen.getByTestId('category-name').props.maxLength).toBe(40);
  });

  test('HU8-CA04: shows «La categoría ya existe» and disables «Guardar»', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('categories-new'));
    await fillForm('alimentación', 'expense', 'food');
    expect(await screen.findByText('La categoría ya existe')).toBeTruthy();
    expect(
      screen.getByTestId('category-save').props.accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.changeText(screen.getByTestId('category-name'), 'Viajes');
    await act(async () => {});
    expect(screen.queryByText('La categoría ya existe')).toBeNull();
  });

  test('HU8-CA05: two categories can share the same icon', async () => {
    await setup();
    await createFromScreen('Mascotas', 'expense', 'pet');
    await createFromScreen('Veterinaria', 'expense', 'pet');
    expect(screen.getByText('Mascotas')).toBeTruthy();
    expect(screen.getByText('Veterinaria')).toBeTruthy();
  });

  test('HU8-CA06: edits the name, type and icon of an own category', async () => {
    await setup();
    await createFromScreen('Mascotas');
    await fireEvent.press(
      screen.getByTestId(`category-edit-${ownRowId('Mascotas')}`),
    );
    expect(screen.getByText('Editar categoría')).toBeTruthy();
    expect(screen.getByText('Guardar')).toBeTruthy();
    expect(screen.getByTestId('category-name').props.value).toBe('Mascotas');
    await fillForm('Ventas', 'income', 'cart');
    await fireEvent.press(screen.getByTestId('category-save'));
    expect(await screen.findByText('Ventas')).toBeTruthy();
    expect(screen.queryByText('Mascotas')).toBeNull();
  });

  test('«Cancelar» closes the form without saving', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('categories-new'));
    await fillForm('Viajes', 'expense', 'plane');
    await fireEvent.press(screen.getByTestId('category-cancel'));
    expect(screen.queryByTestId('category-form')).toBeNull();
    expect(screen.queryByText('Viajes')).toBeNull();
  });

  test('HU8-CA07b: «Eliminar» opens the literal confirmation and «Cancelar» keeps it', async () => {
    await setup();
    await createFromScreen('Gimnasio', 'expense', 'dumbbell');
    const id = ownRowId('Gimnasio');
    await fireEvent.press(screen.getByTestId(`category-delete-${id}`));
    const dialog = await screen.findByTestId('category-delete-dialog');
    expect(
      within(dialog).getByText('¿Está seguro de eliminar esta categoría?'),
    ).toBeTruthy();
    expect(
      within(dialog).getByText(
        "Los movimientos asociados a esta categoría serán reasignados automáticamente a la categoría 'Otros'.",
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('category-delete-cancel'));
    expect(screen.queryByTestId('category-delete-dialog')).toBeNull();
    expect(screen.getByText('Gimnasio')).toBeTruthy();
  });

  test('HU8-CA07a: «Confirmar» deletes the own category', async () => {
    const { database } = await setup();
    await createFromScreen('Gimnasio', 'expense', 'dumbbell');
    const id = ownRowId('Gimnasio');
    await fireEvent.press(screen.getByTestId(`category-delete-${id}`));
    await fireEvent.press(await screen.findByTestId('category-delete-confirm'));
    await act(async () => {});
    expect(screen.queryByText('Gimnasio')).toBeNull();
    const stored = await database.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id],
    );
    expect(stored.rows).toEqual([]);
  });

  test('HU8-CA07b/c: the dialog counts the movements and «Confirmar» moves them to «Otros»', async () => {
    const { database, sessions, session } = await setup();
    await createFromScreen('Gimnasio', 'expense', 'dumbbell');
    const id = ownRowId('Gimnasio');
    const movements = new MovementManagementService({
      database,
      sessions,
      random: nodeRandomBytes,
    });
    for (const amount of ['80000', '95000']) {
      await movements.create(session, {
        type: 'expense',
        amount,
        date: '03/10/2026',
        categoryId: id,
        description: '',
      });
    }
    await fireEvent.press(screen.getByTestId(`category-delete-${id}`));
    const dialog = await screen.findByTestId('category-delete-dialog');
    expect(
      within(dialog).getByText(/2 movimientos serán reasignados\./),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('category-delete-confirm'));
    await act(async () => {});
    const stored = await database.execute(
      "SELECT count(*) AS total FROM movements WHERE category_id = 'other'",
    );
    expect(stored.rows[0]).toEqual({ total: 2 });
  });

  test('HU8-CA07b: without movements the dialog has no count line', async () => {
    await setup();
    await createFromScreen('Gimnasio', 'expense', 'dumbbell');
    await fireEvent.press(
      screen.getByTestId(`category-delete-${ownRowId('Gimnasio')}`),
    );
    const dialog = await screen.findByTestId('category-delete-dialog');
    expect(within(dialog).queryByText(/reasignados?\./)).toBeNull();
  });

  test('Task 36: a tap outside the form closes it without saving; inside it does not', async () => {
    const { database } = await setup();
    await fireEvent.press(screen.getByTestId('categories-new'));
    await fireEvent.changeText(screen.getByTestId('category-name'), 'Mascotas');
    await fireEvent.press(screen.getAllByText('Nueva categoría').at(-1)!);
    expect(screen.getByTestId('category-form')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('category-form-backdrop'));
    expect(screen.queryByTestId('category-form')).toBeNull();
    const stored = await database.execute(
      "SELECT count(*) AS total FROM categories WHERE name = 'Mascotas'",
    );
    expect(stored.rows[0]).toEqual({ total: 0 });
  });

  test('Task 36: a tap outside the delete dialog cancels the deletion', async () => {
    await setup();
    await createFromScreen('Gimnasio', 'expense', 'dumbbell');
    const id = ownRowId('Gimnasio');
    await fireEvent.press(screen.getByTestId(`category-delete-${id}`));
    await screen.findByTestId('category-delete-dialog');
    await fireEvent.press(
      screen.getByTestId('category-delete-dialog-backdrop'),
    );
    expect(screen.queryByTestId('category-delete-dialog')).toBeNull();
    expect(screen.getByTestId(`category-delete-${id}`)).toBeTruthy();
  });

  test('E06-D4: the Android back button returns to the history', async () => {
    const listeners: Array<Parameters<typeof BackHandler.addEventListener>[1]> =
      [];
    const spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listeners.push(handler);
        return { remove: jest.fn() };
      });
    const { onBack } = await setup();
    expect(screen.queryByText(/Volver/)).toBeNull();
    expect(listeners.at(-1)!({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(
      true,
    );
    expect(onBack).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('an expired session leaves the screen', async () => {
    const { onSessionExpired, sessions } = await setup();
    sessions.end();
    await fireEvent.press(screen.getByTestId('categories-new'));
    await fillForm('Viajes', 'expense', 'plane');
    await fireEvent.press(screen.getByTestId('category-save'));
    await act(async () => {});
    expect(onSessionExpired).toHaveBeenCalled();
  });
});

describe('Task 33: HU8 empty section', () => {
  test('«Mis categorías» explains how to create one while it is empty', async () => {
    await setup();
    expect(screen.getByTestId('categories-own-empty')).toHaveTextContent(
      'Aún no tienes categorías propias. Usa «+ Nueva categoría» para crear una.',
    );
  });
});

describe('E-COR: HU8 modals (F1-F6)', () => {
  test('F1, F2: the form is centred and the type options carry coloured arrows', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('categories-new'));
    expect(screen.queryByTestId('category-form-handle')).toBeNull();
    expect(
      screen.getByTestId('category-type-icon-income', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      screen.getByTestId('category-type-icon-expense', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
  });

  test('F3-F6: alert icon, centred title, yellow warning, centred count and a red «Confirmar»', async () => {
    const { database, sessions, session } = await setup();
    await createFromScreen('Gimnasio', 'expense', 'dumbbell');
    const id = ownRowId('Gimnasio');
    const movements = new MovementManagementService({
      database,
      sessions,
      random: nodeRandomBytes,
    });
    await movements.create(session, {
      type: 'expense',
      amount: '80000',
      date: '03/10/2026',
      categoryId: id,
      description: '',
    });
    await fireEvent.press(screen.getByTestId(`category-delete-${id}`));
    await screen.findByTestId('category-delete-dialog');
    expect(screen.getByTestId('category-delete-alert')).toBeTruthy();
    expect(screen.getByTestId('category-delete-title')).toHaveStyle({
      textAlign: 'center',
    });
    expect(screen.getByTestId('category-delete-warning')).toHaveStyle({
      backgroundColor: '#FFF6DB',
    });
    expect(screen.getByTestId('category-delete-count')).toHaveTextContent(
      '1 movimiento será reasignado.',
    );
    expect(screen.getByTestId('category-delete-count')).toHaveStyle({
      textAlign: 'center',
    });
    expect(screen.getByTestId('category-delete-confirm')).toHaveStyle({
      backgroundColor: '#B3261E',
    });
  });
});

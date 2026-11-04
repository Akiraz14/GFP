import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import { CategoryManagementService } from '../../src/business/categories/categoryManagement';
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
    expect(screen.getByTestId('categories-empty')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('categories-new'));
    expect(screen.getByText('Nueva categoría')).toBeTruthy();
    expect(screen.getByText('Nombre de la categoría')).toBeTruthy();
    expect(screen.getByText('Tipo de categoría')).toBeTruthy();
    expect(screen.getByText('Ícono')).toBeTruthy();
    await fillForm('Freelance', 'income', 'briefcase');
    await fireEvent.press(screen.getByTestId('category-save'));
    expect(await screen.findByText('Freelance')).toBeTruthy();
    expect(screen.queryByTestId('category-form')).toBeNull();
    expect(screen.queryByTestId('categories-empty')).toBeNull();
    const id = ownRowId('Freelance');
    expect(screen.getByTestId(`category-edit-${id}`)).toBeTruthy();
    expect(screen.getByTestId(`category-delete-${id}`)).toBeTruthy();
  });

  test('asks for the name and the icon before saving', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('categories-new'));
    await fireEvent.press(screen.getByTestId('category-save'));
    expect(screen.getByText('Ingresa el nombre de la categoría.')).toBeTruthy();
    expect(screen.getByText('Selecciona un ícono.')).toBeTruthy();
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
    const dialog = screen.getByTestId('category-delete-dialog');
    expect(
      within(dialog).getByText(
        /¿Está seguro de eliminar esta categoría\?[\s\S]*Los movimientos asociados a esta categoría serán reasignados automáticamente a la categoría 'Otros'\./,
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
    await fireEvent.press(screen.getByTestId('category-delete-confirm'));
    await act(async () => {});
    expect(screen.queryByText('Gimnasio')).toBeNull();
    const stored = await database.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id],
    );
    expect(stored.rows).toEqual([]);
  });

  test('«Volver» returns to the history and an expired session leaves the screen', async () => {
    const { onBack, onSessionExpired, sessions } = await setup();
    await fireEvent.press(screen.getByTestId('categories-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    sessions.end();
    await fireEvent.press(screen.getByTestId('categories-new'));
    await fillForm('Viajes', 'expense', 'plane');
    await fireEvent.press(screen.getByTestId('category-save'));
    await act(async () => {});
    expect(onSessionExpired).toHaveBeenCalled();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { MessageDialog } from '../../src/presentation/components/MessageDialog';
import { SelectField } from '../../src/presentation/components/SelectField';

// Task 36: los modales se cierran al tocar fuera de su contenido y no al tocar dentro.
describe('Task 36: closing modals with a tap outside', () => {
  test('MessageDialog: outside closes, inside does not, actions still work', async () => {
    const onRequestClose = jest.fn();
    const onConfirm = jest.fn();
    await render(
      <MessageDialog
        actions={[
          { label: 'Confirmar', onPress: onConfirm, testID: 'confirm' },
        ]}
        message="¿Está seguro?"
        onRequestClose={onRequestClose}
        testID="dialog"
      />,
    );
    await fireEvent.press(screen.getByText('¿Está seguro?'));
    expect(onRequestClose).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onRequestClose).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('dialog-backdrop'));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  test('the backdrop is hidden from accessibility services', async () => {
    await render(
      <MessageDialog
        actions={[]}
        message="Mensaje"
        onRequestClose={jest.fn()}
        testID="dialog"
      />,
    );
    const backdrop = screen.getByTestId('dialog-backdrop');
    expect(backdrop.props.accessible).toBe(false);
    expect(backdrop.props.importantForAccessibility).toBe('no');
  });

  test('SelectField: outside closes the list without changing the value; inside does not close', async () => {
    const onChange = jest.fn();
    await render(
      <SelectField
        error={null}
        label="Tipo"
        onChange={onChange}
        options={[
          { value: 'a', label: 'Opción A' },
          { value: 'b', label: 'Opción B' },
        ]}
        placeholder="Seleccionar"
        testID="select"
        value="a"
      />,
    );
    await fireEvent.press(screen.getByTestId('select'));
    expect(screen.getByTestId('select-options')).toBeTruthy();
    // El título de la lista es contenido: tocarlo no la cierra.
    await fireEvent.press(screen.getAllByText('Tipo')[1]);
    expect(screen.getByTestId('select-options')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('select-backdrop'));
    expect(screen.queryByTestId('select-options')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});

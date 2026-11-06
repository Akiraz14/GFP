// Adaptado de daniela888-li/GFP (6ec6d3c); se añaden las pruebas del borrado de la imagen.
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReceiptGateway } from '../../src/processing/receiptGateway';
import { ReceiptCaptureScreen } from '../../src/presentation/receipts/ReceiptCaptureScreen';

const NOW = new Date(2026, 10, 4, 12).getTime();
const IMAGE = {
  uri: 'file:///f.jpg',
  fileName: 'f.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 100,
};

async function setup(overrides: Partial<ReceiptGateway> = {}) {
  const gateway: ReceiptGateway = {
    takePhoto: jest.fn(async () => IMAGE),
    pickFromGallery: jest.fn(async () => IMAGE),
    recognizeText: jest.fn(
      async () => 'Tienda Sol\nFecha 01/11/2026\nTOTAL 45.500',
    ),
    discardImage: jest.fn(async () => {}),
    ...overrides,
  };
  const onCancel = jest.fn();
  const onContinue = jest.fn();
  await render(
    <ReceiptCaptureScreen
      gateway={gateway}
      now={() => NOW}
      onCancel={onCancel}
      onContinue={onContinue}
    />,
  );
  return { gateway, onCancel, onContinue };
}

describe('HU7 capture', () => {
  test('HU7-CA01 and CA04: processes the photo and shows the summary', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    expect(await screen.findByTestId('receipt-summary')).toBeTruthy();
    expect(screen.getByTestId('receipt-preview')).toBeTruthy();
    expect(screen.getByTestId('receipt-badge')).toHaveTextContent('COMPLETADO');
    expect(screen.getByText('$45.500,00')).toBeTruthy();
    expect(screen.getByTestId('receipt-retry')).toBeTruthy();
  });

  test('HU7-CA02: rejects an unsupported image', async () => {
    await setup({
      pickFromGallery: async () => ({ ...IMAGE, sizeBytes: 6 * 1024 * 1024 }),
    });
    await fireEvent.press(screen.getByTestId('receipt-pick-gallery'));
    expect(
      await screen.findByText(
        'Formato o tamaño de imagen no soportado. Usa una imagen JPG o PNG de máximo 5 MB.',
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId('receipt-preview')).toBeNull();
  });

  test('a cancelled capture keeps the initial state', async () => {
    await setup({ takePhoto: async () => null });
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    expect(screen.getByTestId('receipt-take-photo')).toBeTruthy();
  });

  test('HU7-CA07: a partial reading passes only the detected data', async () => {
    const { onContinue } = await setup({
      recognizeText: async () => 'TOTAL 45.500',
    });
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    await screen.findByText('INCOMPLETO');
    expect(screen.getAllByText('No identificado')).toHaveLength(2);
    await fireEvent.press(screen.getByTestId('receipt-continue'));
    expect(onContinue).toHaveBeenCalledWith({
      amount: '45.500',
      date: '',
      description: '',
    });
  });

  test('HU7-CA06 and CA08: without data warns and continues empty', async () => {
    const { onContinue } = await setup({
      recognizeText: async () => {
        throw new Error('ocr failed');
      },
    });
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    expect(await screen.findByTestId('receipt-no-data')).toHaveTextContent(
      'No se pudo leer la información de la imagen. Por favor, intente con otra imagen o continúe para ingresar los datos manualmente',
    );
    await fireEvent.press(screen.getByTestId('receipt-continue'));
    expect(onContinue).toHaveBeenCalledWith({
      amount: '',
      date: '',
      description: '',
    });
  });

  test('HU7-CA11 and CA12: Reintentar restores and Cancelar leaves', async () => {
    const { onCancel } = await setup();
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    await fireEvent.press(await screen.findByTestId('receipt-retry'));
    expect(screen.getByTestId('receipt-take-photo')).toBeTruthy();
    expect(screen.queryByTestId('receipt-preview')).toBeNull();
    await fireEvent.press(screen.getByTestId('receipt-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('shows the literal header of HU7', async () => {
    await setup();
    expect(screen.getByText('Movimiento con foto')).toBeTruthy();
    expect(screen.getByText('Tomar fotografía')).toBeTruthy();
    expect(screen.getByText('Seleccionar de la galería')).toBeTruthy();
  });

  test('«Reintentar» discards the temporary photo', async () => {
    const { gateway } = await setup();
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    await fireEvent.press(await screen.findByTestId('receipt-retry'));
    expect(gateway.discardImage).toHaveBeenCalledWith('file:///f.jpg');
  });

  test('an unsupported image is discarded right away', async () => {
    const { gateway } = await setup({
      pickFromGallery: async () => ({
        ...IMAGE,
        uri: 'file:///big.png',
        fileName: 'big.png',
        sizeBytes: 6 * 1024 * 1024,
      }),
    });
    await fireEvent.press(screen.getByTestId('receipt-pick-gallery'));
    await screen.findByTestId('receipt-notice');
    expect(gateway.discardImage).toHaveBeenCalledWith('file:///big.png');
  });

  test('leaving the screen discards the shown photo', async () => {
    const { gateway } = await setup();
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    await screen.findByTestId('receipt-summary');
    expect(gateway.discardImage).not.toHaveBeenCalled();
    await screen.unmount();
    expect(gateway.discardImage).toHaveBeenCalledWith('file:///f.jpg');
  });
});

describe('Task 32: review state of the HU7 prototype', () => {
  test('each extracted value is marked as identified or not', async () => {
    await setup({ recognizeText: jest.fn(async () => 'TOTAL 45.500') });
    await fireEvent.press(screen.getByTestId('receipt-take-photo'));
    await screen.findByTestId('receipt-summary');
    expect(screen.getAllByTestId('receipt-mark-found')).toHaveLength(1);
    expect(screen.getAllByTestId('receipt-mark-missing')).toHaveLength(2);
    expect(screen.getByLabelText('Identificado')).toBeTruthy();
    expect(screen.getByTestId('receipt-preview-frame')).toHaveStyle({
      borderColor: '#FFC166',
      borderWidth: 2,
    });
  });
});

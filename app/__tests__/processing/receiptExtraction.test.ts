import {
  extractReceiptData,
  parseReceiptNumber,
  rowsFromLines,
} from '../../src/processing/receiptExtraction';
import { isSupportedReceiptImage } from '../../src/processing/receiptImage';

const TODAY = '2026-11-04';

describe('HU7-CA03 amount', () => {
  test.each([
    ['45.500', 4550000],
    ['45,500', 4550000],
    ['1.234,50', 123450],
    ['1,234.50', 123450],
    ['45500', 4550000],
    ['45.50', 4550],
  ])('reads %s', (value, cents) => {
    expect(parseReceiptNumber(value)).toBe(cents);
  });

  test('uses the total line and ignores the subtotal', () => {
    const data = extractReceiptData(
      'Tienda Sol\nSUBTOTAL 40.000\nIVA 5.500\nTOTAL $ 45.500',
      TODAY,
    );
    expect(data.amountCents).toBe(4550000);
  });

  test('prefers the total to pay', () => {
    const data = extractReceiptData(
      'Tienda\nTOTAL A PAGAR 30.000\nTOTAL ITEMS 3',
      TODAY,
    );
    expect(data.amountCents).toBe(3000000);
  });

  test('leaves the amount empty without a total line', () => {
    expect(
      extractReceiptData('Tienda\nCafe 4.500\nPan 2.000', TODAY).amountCents,
    ).toBeNull();
  });
});

describe('HU7-CA03 date', () => {
  test.each([
    ['Fecha: 24/10/2026', '24/10/2026'],
    ['Fecha 24-10-26', '24/10/2026'],
    ['2026-10-24 11:45', '24/10/2026'],
    ['24 de octubre de 2026', '24/10/2026'],
    ['24/Oct/2026', '24/10/2026'],
  ])('reads %s', (line, date) => {
    expect(extractReceiptData(line, TODAY).date).toBe(date);
  });

  test('never loads a future or impossible date', () => {
    expect(extractReceiptData('Fecha 05/11/2026', TODAY).date).toBeNull();
    expect(extractReceiptData('Fecha 31/02/2026', TODAY).date).toBeNull();
  });

  test('leaves the date empty with several unlabeled candidates', () => {
    expect(extractReceiptData('01/10/2026\n02/10/2026', TODAY).date).toBeNull();
  });

  test('ignores the due date when the invoice date is labeled', () => {
    expect(
      extractReceiptData(
        'Fecha vencimiento 03/11/2026\nFecha 01/10/2026',
        TODAY,
      ).date,
    ).toBe('01/10/2026');
  });
});

describe('HU7-CA03 merchant', () => {
  test('uses the first useful line', () => {
    expect(
      extractReceiptData(
        'FACTURA DE VENTA\nNIT 900123456\nSupermercado La Canasta\nTOTAL 10',
        TODAY,
      ).merchant,
    ).toBe('Supermercado La Canasta');
  });

  test('an unreadable text gives no data', () => {
    expect(extractReceiptData('... 12 //', TODAY)).toEqual({
      amountCents: null,
      date: null,
      merchant: null,
    });
  });
});

describe('app and bank receipts', () => {
  test('reads Monto when there is no total line', () => {
    const data = extractReceiptData(
      [
        'RappiCard',
        '¡Hola, DANIELA!',
        'Realizaste una compra con tu RappiCard.',
        'Detalle de tu transacción:',
        'Monto $11.800',
        'Método de pago *1666',
        'No. de autorización 000757',
        'Fecha 03/11/2026',
      ].join('\n'),
      TODAY,
    );
    expect(data).toEqual({
      amountCents: 1180000,
      date: '03/11/2026',
      merchant: 'RappiCard',
    });
  });

  test('takes the value of Monto from the next line', () => {
    expect(extractReceiptData('Monto\n$11.800', TODAY).amountCents).toBe(
      1180000,
    );
  });

  test('uses a single value with the money sign', () => {
    expect(
      extractReceiptData('Tienda\nGracias\n$ 8.000', TODAY).amountCents,
    ).toBe(800000);
  });

  test('does not guess among several values', () => {
    expect(
      extractReceiptData('Café $ 8.000\nPan $ 2.000', TODAY).amountCents,
    ).toBeNull();
  });

  test('does not read Valor Unitario as the amount', () => {
    expect(
      extractReceiptData('Valor Unitario 4.500\nOtro', TODAY).amountCents,
    ).toBeNull();
  });
});

describe('electronic invoices with columns', () => {
  const line = (text: string, top: number, left: number) => ({
    text,
    frame: { top, left, height: 10 },
  });

  test('joins labels and values that the OCR returns separately', () => {
    expect(
      rowsFromLines([
        line('2022-02-07 20:19:12', 101, 200),
        line('TOTAL', 300, 50),
        line('FECHA DOCUMENTO:', 100, 50),
        line('$ 4.450,00', 299, 200),
      ]),
    ).toBe('FECHA DOCUMENTO: 2022-02-07 20:19:12\nTOTAL $ 4.450,00');
  });

  test('keeps the plain lines when there are no positions', () => {
    expect(rowsFromLines([{ text: 'a' }, { text: 'b' }])).toBe('a\nb');
  });

  test('reads the invoice shown by the user and ignores the resolution dates', () => {
    const data = extractReceiptData(
      [
        'UNITECNAR FUNDACIÓN UNIVERSITARIA ANTONIO DE AREVALO',
        'Resolución de facturación electrónica DIAN No. 18764 de 2021-11-04 a 2022-11-04',
        'FACTURA ELECTRÓNICA DE VENTA',
        'NÚMERO: T14202 VENCIMIENTO:',
        'FECHA DOCUMENTO: 2022-02-07 20:19:12',
        'Código UND Descripción Cantidad Valor Unitario IVA% INC% Subtotal Valor Total',
        'INTERESES CUOTA N° 03 1.00 $ 4,450.00 0 0 $ 4,450.00 $ 4,450.00',
        'Subtotal $ 4,450.00',
        'Total IVA $ 0.00',
        'Total a Pagar $ 4,450.00',
      ].join('\n'),
      TODAY,
    );
    expect(data).toEqual({
      amountCents: 445000,
      date: '07/02/2022',
      merchant: 'UNITECNAR FUNDACIÓN UNIVERSITARIA ANTONIO DE AREVALO',
    });
  });

  test('takes the amount from the next line when the label is alone', () => {
    expect(
      extractReceiptData('Tienda\nTOTAL A PAGAR\n$ 10.000', TODAY).amountCents,
    ).toBe(1000000);
  });

  test('a header row with Valor Total and no value is not an amount', () => {
    expect(
      extractReceiptData('Tienda\nCantidad Valor Total', TODAY).amountCents,
    ).toBeNull();
  });
});

describe('HU7-CA02 image', () => {
  const image = {
    uri: 'file:///a.jpg',
    fileName: 'a.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 5 * 1024 * 1024,
  };

  test('accepts JPG and PNG up to 5 MB', () => {
    expect(isSupportedReceiptImage(image)).toBe(true);
    expect(
      isSupportedReceiptImage({
        ...image,
        fileName: 'b.PNG',
        mimeType: null,
      }),
    ).toBe(true);
  });

  test('rejects other formats, larger files and an unknown size', () => {
    expect(
      isSupportedReceiptImage({
        ...image,
        uri: 'file:///a.gif',
        fileName: 'a.gif',
        mimeType: 'image/gif',
      }),
    ).toBe(false);
    expect(
      isSupportedReceiptImage({ ...image, sizeBytes: 5 * 1024 * 1024 + 1 }),
    ).toBe(false);
    expect(isSupportedReceiptImage({ ...image, sizeBytes: null })).toBe(false);
  });
});

describe('AJ-02: rotated documents, codes and merchant name', () => {
  // Synthetic receipts of the E02 OCR plan (ocrFixtures.ts of spike-02-v4), laid out as ML
  // Kit returns them: one line per text row, with its box and its corner points.
  const BANNER = 'DOCUMENTO SINTÉTICO - SIN VALIDEZ';
  const RECEIPT_03 = [
    BANNER,
    'COMERCIO DE PRUEBA 03',
    'NIT 000000000-0',
    'FACTURA SINT-0003',
    'FECHA 2026-03-21',
    'SERVICIO DE PRUEBA 7.250',
    'TOTAL COP 7.250',
    'REF SINTOCR-03-H6TNB4',
  ];
  const RECEIPT_02 = [
    BANNER,
    'TIENDA FICTICIA 02',
    'NIT 000000000-0',
    'FACTURA SINT-0002',
    'FECHA 2026-02-03',
    'ARTÍCULO DE PRUEBA A 25.000',
    'ARTÍCULO DE PRUEBA B 33.900',
    'TOTAL COP 58.900',
    'REF SINTOCR-02-P3WZ6D',
  ];
  const WIDTH = 1200;
  const HEIGHT = 1600;

  type Turn = 0 | 90 | 180 | 270;
  // Turns a point of the upright page clockwise, as the generator does (expand = true).
  function turn(x: number, y: number, degrees: Turn) {
    switch (degrees) {
      case 0:
        return { x, y };
      case 90:
        return { x: HEIGHT - y, y: x };
      case 180:
        return { x: WIDTH - x, y: HEIGHT - y };
      case 270:
        return { x: y, y: WIDTH - x };
    }
  }

  function recognized(texts: readonly string[], degrees: Turn) {
    return texts.map((text, index) => {
      const left = 100;
      const top = 100 + index * 73;
      const width = text.length * 25;
      const height = 46;
      const cornerPoints = [
        turn(left, top, degrees),
        turn(left + width, top, degrees),
        turn(left + width, top + height, degrees),
        turn(left, top + height, degrees),
      ];
      const xs = cornerPoints.map(point => point.x);
      const ys = cornerPoints.map(point => point.y);
      return {
        text,
        frame: {
          top: Math.min(...ys),
          left: Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        },
        cornerPoints,
      };
    });
  }

  test('COMERCIO DE PRUEBA 03 turned 90 degrees: total 7.250, not the 03 of the header', () => {
    const text = rowsFromLines(recognized(RECEIPT_03, 90));
    expect(text.split('\n')).toEqual(RECEIPT_03);
    expect(extractReceiptData(text, TODAY)).toEqual({
      amountCents: 725_000,
      date: '21/03/2026',
      merchant: 'COMERCIO DE PRUEBA',
    });
  });

  test.each([0, 180, 270] as const)(
    'the same document read at %i degrees gives the same data',
    degrees => {
      expect(
        extractReceiptData(
          rowsFromLines(recognized(RECEIPT_03, degrees)),
          TODAY,
        ),
      ).toEqual({
        amountCents: 725_000,
        date: '21/03/2026',
        merchant: 'COMERCIO DE PRUEBA',
      });
    },
  );

  test('TIENDA FICTICIA 02: the items are read but the total is 58.900', () => {
    const text = rowsFromLines(recognized(RECEIPT_02, 0));
    expect(text).toContain('ARTÍCULO DE PRUEBA A 25.000');
    expect(text).toContain('ARTÍCULO DE PRUEBA B 33.900');
    expect(extractReceiptData(text, TODAY)).toEqual({
      amountCents: 5_890_000,
      date: '03/02/2026',
      merchant: 'TIENDA FICTICIA',
    });
  });

  test('even when the rows merge, the total is the value right after TOTAL', () => {
    expect(
      extractReceiptData(
        'REF SINTOCR-03-H6TNB4 TOTAL COP 7.250 SERVICIO DE PRUEBA 7.250 FECHA 2026-03-21 FACTURA SINT-0003 NIT 000000000-0 COMERCIO DE PRUEBA 03',
        TODAY,
      ).amountCents,
    ).toBe(725_000);
  });

  test('codes, references and numbers with a leading zero are never amounts', () => {
    expect(
      extractReceiptData('TOTAL SINT-0003\nREF 03', TODAY).amountCents,
    ).toBeNull();
    expect(extractReceiptData('TOTAL 03', TODAY).amountCents).toBeNull();
    expect(extractReceiptData('TOTAL $ 0,50', TODAY).amountCents).toBe(50);
  });

  test('a header without a merchant name gives no merchant', () => {
    expect(
      extractReceiptData(`${BANNER}\nTOTAL 7.250`, TODAY).merchant,
    ).toBeNull();
  });
});

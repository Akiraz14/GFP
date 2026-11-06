import {
  MAX_AMOUNT_CENTS,
  amountInputFromCents,
  formatMoney,
  maskAmountInput,
  parseAmountInput,
} from '../../src/business/money/money';

describe('HU4-CA05: amount input', () => {
  test.each([
    ['45500', 4_550_000],
    ['45.500', 4_550_000],
    ['1.250.000', 125_000_000],
    ['1.250.000,50', 125_000_050],
    ['1,250,000.50', 125_000_050],
    ['45,5', 4_550],
    ['45,50', 4_550],
    ['45.50', 4_550],
    ['0,01', 1],
    ['$ 1.000', 100_000],
    [' 12 ', 1_200],
    ['999.999.999.999,99', MAX_AMOUNT_CENTS],
  ])('accepts «%s» as %d cents', (raw, cents) => {
    expect(parseAmountInput(raw)).toBe(cents);
  });

  test.each([
    '',
    '   ',
    '0',
    '0,00',
    '-100',
    '+100',
    'abc',
    '12a',
    '1,234',
    '1,2,3',
    '12,345',
    '1.2345',
    '1.25.000',
    '1.250,000',
    '1e5',
    '1.000.000.000.000,00',
    '45,505',
    ',50',
    '50,',
    '1.000,',
    'NaN',
  ])('rejects «%s»', raw => {
    expect(parseAmountInput(raw)).toBeNull();
  });
});

describe('D-01: Colombian money format', () => {
  test.each([
    [125_000_000, '$1.250.000,00'],
    [4_550, '$45,50'],
    [1, '$0,01'],
    [0, '$0,00'],
    [MAX_AMOUNT_CENTS, '$999.999.999.999,99'],
    [-125_000, '-$1.250,00'],
  ])('%d cents is shown as %s', (cents, text) => {
    expect(formatMoney(cents)).toBe(text);
  });

  test('the edit field shows the masked amount and reads back the same', () => {
    expect(amountInputFromCents(125_000_050)).toBe('1.250.000,50');
    expect(amountInputFromCents(4_550_000)).toBe('45.500,00');
    expect(amountInputFromCents(1)).toBe('0,01');
    for (const cents of [1, 4_550, 125_000_050, MAX_AMOUNT_CENTS]) {
      expect(parseAmountInput(amountInputFromCents(cents))).toBe(cents);
    }
  });
});

describe('Bug 40 and Task 37: continuous decimal mask', () => {
  test('digits fill the cents first, like an ATM', () => {
    const typed = ['4', '45', '455', '4550', '45500', '455000', '4550000'];
    expect(typed.map(maskAmountInput)).toEqual([
      '0,04',
      '0,45',
      '4,55',
      '45,50',
      '455,00',
      '4.550,00',
      '45.500,00',
    ]);
  });

  test('typing one more digit on the masked text keeps the numeric value', () => {
    // El TextInput entrega el texto anterior más la tecla pulsada.
    expect(maskAmountInput('4.550,00' + '1')).toBe('45.500,01');
    expect(parseAmountInput(maskAmountInput('45.500,0' + '7'))).toBe(4_550_007);
  });

  test('deleting removes the last digit', () => {
    // Al borrar, el TextInput entrega el texto sin su último carácter.
    expect(maskAmountInput('45.500,0')).toBe('4.550,00');
    expect(maskAmountInput('0,0')).toBe('');
    expect(maskAmountInput('0,4')).toBe('0,04');
  });

  test('ignores everything but digits and leading zeros', () => {
    expect(maskAmountInput('')).toBe('');
    expect(maskAmountInput('abc')).toBe('');
    expect(maskAmountInput('-10')).toBe('0,10');
    expect(maskAmountInput('$ 0001.250')).toBe('12,50');
    expect(maskAmountInput('0')).toBe('');
  });

  test('stops at the maximum amount', () => {
    expect(maskAmountInput('9'.repeat(20))).toBe('999.999.999.999,99');
    expect(parseAmountInput(maskAmountInput('9'.repeat(20)))).toBe(
      MAX_AMOUNT_CENTS,
    );
  });

  test('a masked text is always a valid amount except when empty', () => {
    for (const raw of ['1', '99', '123456', '100000000']) {
      expect(parseAmountInput(maskAmountInput(raw))).toBe(Number(raw));
    }
  });
});

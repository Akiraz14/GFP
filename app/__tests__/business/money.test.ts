import {
  MAX_AMOUNT_CENTS,
  amountInputForParsing,
  applyAmountEdit,
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
    expect(amountInputFromCents(4_550_000)).toBe('45.500');
    expect(amountInputFromCents(1)).toBe('0,01');
    for (const cents of [1, 4_550, 125_000_050, MAX_AMOUNT_CENTS]) {
      expect(parseAmountInput(amountInputFromCents(cents))).toBe(cents);
    }
  });
});

describe('E-COR-D3: amount mask with explicit decimals', () => {
  function typeKeys(keys: string): Array<[string, number]> {
    let value = '';
    return [...keys].map(key => {
      const edit = applyAmountEdit(value, value + key);
      value = edit.text;
      return [edit.text, edit.caret];
    });
  }

  test('digits are whole pesos: 45500 is $45.500', () => {
    expect(typeKeys('45500').map(([text]) => text)).toEqual([
      '4',
      '45',
      '455',
      '4.550',
      '45.500',
    ]);
    expect(parseAmountInput('45.500')).toBe(4_550_000);
  });

  test('decimals start only with an explicit comma or dot', () => {
    expect(typeKeys('45500,50').at(-1)).toEqual(['45.500,50', 9]);
    expect(typeKeys('45500.50').at(-1)).toEqual(['45.500,50', 9]);
    expect(typeKeys('45,').at(-1)).toEqual(['45,', 3]);
    expect(typeKeys(',5').map(([text]) => text)).toEqual(['0,', '0,5']);
    expect(parseAmountInput(amountInputForParsing('45.500,5'))).toBe(4_550_050);
  });

  test('a second separator and a third decimal are ignored', () => {
    expect(typeKeys('45,5,').at(-1)?.[0]).toBe('45,5');
    expect(typeKeys('45.5.').at(-1)?.[0]).toBe('45,5');
    expect(typeKeys('45,505').at(-1)?.[0]).toBe('45,50');
  });

  test('the caret stays after the digit that was typed or deleted', () => {
    expect(typeKeys('4550000').at(-1)).toEqual(['4.550.000', 9]);
    expect(applyAmountEdit('4.550.000', '4.50.000')).toEqual({
      text: '450.000',
      caret: 2,
    });
    expect(applyAmountEdit('45.500', '45.50')).toEqual({
      text: '4.550',
      caret: 5,
    });
    expect(applyAmountEdit('45.500,50', '45.500,5')).toEqual({
      text: '45.500,5',
      caret: 8,
    });
    expect(applyAmountEdit('45.500,5', '45.500,')).toEqual({
      text: '45.500,',
      caret: 7,
    });
    expect(applyAmountEdit('45.500,', '45.500')).toEqual({
      text: '45.500',
      caret: 6,
    });
  });

  test('a pasted or prefilled text keeps a single convention', () => {
    expect(maskAmountInput('45500.50')).toBe('45.500,50');
    expect(maskAmountInput('45500,50')).toBe('45.500,50');
    expect(maskAmountInput('1.250.000,50')).toBe('1.250.000,50');
    expect(maskAmountInput('1,250,000.50')).toBe('1.250.000,50');
    expect(maskAmountInput('45.500')).toBe('45.500');
    expect(maskAmountInput('$ 45.500')).toBe('45.500');
    expect(maskAmountInput('abc')).toBe('');
    expect(maskAmountInput('007')).toBe('7');
  });

  test('stops at twelve integer digits and two decimals', () => {
    expect(maskAmountInput('1234567890123')).toBe('123.456.789.012');
    expect(maskAmountInput('999999999999,999')).toBe('999.999.999.999,99');
    expect(parseAmountInput('999.999.999.999,99')).toBe(MAX_AMOUNT_CENTS);
  });
});

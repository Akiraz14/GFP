import {
  MAX_AMOUNT_CENTS,
  amountInputFromCents,
  formatMoney,
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

  test('the edit field shows the amount without grouping and reads back the same', () => {
    for (const cents of [1, 4_550, 125_000_050, MAX_AMOUNT_CENTS]) {
      const text = amountInputFromCents(cents);
      expect(text).not.toContain('.');
      expect(parseAmountInput(text)).toBe(cents);
    }
  });
});

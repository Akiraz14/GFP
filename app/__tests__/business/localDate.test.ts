import {
  dateFromIso,
  formatDisplayDate,
  isAfter,
  isValidIsoDate,
  isoDateFromDate,
  parseDisplayDate,
  todayIso,
} from '../../src/business/dates/localDate';

describe('I-06: dates without time', () => {
  test('todayIso uses the local date of the device', () => {
    const now = new Date(2026, 9, 24, 23, 59, 59).getTime();
    expect(todayIso(now)).toBe('2026-10-24');
    expect(todayIso(new Date(2026, 0, 1, 0, 0, 0).getTime())).toBe(
      '2026-01-01',
    );
  });

  test.each([
    ['24/10/2026', '2026-10-24'],
    ['1/2/2026', '2026-02-01'],
    [' 29/02/2024 ', '2024-02-29'],
    ['31/12/1999', '1999-12-31'],
  ])('reads «%s» as %s', (text, iso) => {
    expect(parseDisplayDate(text)).toBe(iso);
  });

  test.each([
    '',
    '2026-10-24',
    '24-10-2026',
    '29/02/2026',
    '31/04/2026',
    '00/10/2026',
    '10/13/2026',
    '24/10/26',
    '24/10/2026 10:00',
    '01/01/1899',
  ])('rejects «%s»', text => {
    expect(parseDisplayDate(text)).toBeNull();
  });

  test('formats ISO dates as DD/MM/AAAA and back', () => {
    expect(formatDisplayDate('2026-03-05')).toBe('05/03/2026');
    expect(parseDisplayDate(formatDisplayDate('2026-03-05'))).toBe(
      '2026-03-05',
    );
  });

  test('converts between ISO dates and local Date objects', () => {
    const date = dateFromIso('2026-10-24');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2026, 9, 24,
    ]);
    expect(date.getHours()).toBe(0);
    expect(isoDateFromDate(date)).toBe('2026-10-24');
    expect(() => dateFromIso('24/10/2026')).toThrow();
  });

  test('validates ISO dates and compares them', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isAfter('2026-10-25', '2026-10-24')).toBe(true);
    expect(isAfter('2026-10-24', '2026-10-24')).toBe(false);
    expect(isAfter('2025-12-31', '2026-01-01')).toBe(false);
  });
});

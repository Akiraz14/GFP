import {
  hasInvalidCodeUnits,
  normalizeFreeTextAnswer,
  normalizeSecret,
} from '../../../src/services/authentication/secretNormalization';

const NFC = 'contraseña-ñ€✓';
const NFD = 'contraseña-ñ€✓';

describe('secret normalization (E02-D2)', () => {
  test('maps canonically equivalent passwords to the same NFC string', () => {
    expect(NFC).not.toBe(NFD);
    expect(normalizeSecret(NFD)).toBe(NFC);
    expect(normalizeSecret(NFC)).toBe(NFC);
  });

  test('keeps case, accents and every space in passwords', () => {
    expect(normalizeSecret(' Clave Segura1! ')).toBe(' Clave Segura1! ');
    expect(normalizeSecret('CLAVE')).not.toBe(normalizeSecret('clave'));
    expect(normalizeSecret('José')).not.toBe(normalizeSecret('Jose'));
  });

  test('detects lone surrogates and control characters', () => {
    expect(hasInvalidCodeUnits('abc\ud800')).toBe(true);
    expect(hasInvalidCodeUnits('\udc00abc')).toBe(true);
    expect(hasInvalidCodeUnits('tab\tinside')).toBe(true);
    expect(hasInvalidCodeUnits('emoji 😀 ok')).toBe(false);
  });

  test('folds free-text answers without losing letters', () => {
    expect(normalizeFreeTextAnswer('  Bogotá   D.C. ')).toBe('bogota d.c.');
    expect(normalizeFreeTextAnswer('BOGOTA d.c.')).toBe('bogota d.c.');
    expect(normalizeFreeTextAnswer('Peña')).toBe(
      normalizeFreeTextAnswer('peña'),
    );
  });
});

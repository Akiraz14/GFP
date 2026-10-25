import {
  isVerifiableCandidate,
  validateNewPassword,
} from '../../../src/services/authentication/passwordPolicy';

describe('password policy (HU1, HU3)', () => {
  test('accepts at least 8 characters with a letter, a number and a symbol', () => {
    expect(validateNewPassword('Clave123!')).toEqual([]);
    expect(validateNewPassword('a1!aaaaa')).toEqual([]);
    expect(validateNewPassword('ñandú 12#')).toEqual([]);
  });

  test('reports each missing rule', () => {
    expect(validateNewPassword('Ab1!')).toEqual(['too_short']);
    expect(validateNewPassword('12345678!')).toEqual(['missing_letter']);
    expect(validateNewPassword('abcdefgh!')).toEqual(['missing_number']);
    expect(validateNewPassword('abcdefgh1')).toEqual(['missing_symbol']);
  });

  test('allows internal spaces but rejects outer whitespace', () => {
    expect(validateNewPassword('mi clave 1!')).toEqual([]);
    expect(validateNewPassword(' miclave1!')).toEqual(['outer_whitespace']);
    expect(validateNewPassword('miclave1! ')).toEqual(['outer_whitespace']);
  });

  test('counts code points after NFC and bounds the length', () => {
    expect(validateNewPassword('ññññ1!')).toEqual(['too_short']);
    expect(validateNewPassword(`${'a'.repeat(126)}1!`)).toEqual([]);
    expect(validateNewPassword(`${'a'.repeat(127)}1!`)).toEqual(['too_long']);
  });

  test('rejects invalid code units before normalization', () => {
    expect(validateNewPassword('Clave123!\ud800')).toEqual([
      'invalid_characters',
    ]);
    expect(isVerifiableCandidate('Clave123!\u0000')).toBe(false);
    expect(isVerifiableCandidate('Clave123!')).toBe(true);
  });
});

import {
  Base64DecodeError,
  constantTimeEqual,
  decodeBase64Strict,
  fromHex,
  toHex,
  utf8Encode,
} from '../../src/infrastructure/security/encoding';

describe('encoding', () => {
  test('decodes canonical base64 and rejects malformed input', () => {
    expect(Array.from(decodeBase64Strict('AAEC/w=='))).toEqual([0, 1, 2, 255]);
    expect(() => decodeBase64Strict('AAE')).toThrow(Base64DecodeError);
    expect(() => decodeBase64Strict('AA*=')).toThrow(Base64DecodeError);
    expect(() => decodeBase64Strict('AAF=')).toThrow(Base64DecodeError);
  });

  test('round-trips hex and encodes UTF-8 exactly', () => {
    const bytes = utf8Encode('contraseña-ñ€✓');
    expect(toHex(bytes)).toBe('636f6e7472617365c3b1612dc3b1e282ace29c93');
    expect(toHex(fromHex('00ff10'))).toBe('00ff10');
  });

  test('compares byte arrays without early exit semantics', () => {
    expect(
      constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])),
    ).toBe(true);
    expect(
      constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3])),
    ).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(
      false,
    );
  });
});

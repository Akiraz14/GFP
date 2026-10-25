import { TurboModuleRegistry } from 'react-native';
import {
  randomIndex,
  randomUuid,
  SecureRandomError,
  secureRandomBytes,
} from '../../src/infrastructure/security/secureRandom';
import { sequenceRandom } from '../../testing/nodeSqliteDatabase';

describe('secure random source', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fails closed when the native module is missing', () => {
    jest.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(() => secureRandomBytes(16)).toThrow(SecureRandomError);
  });

  test('decodes bytes returned by the native module', () => {
    jest.spyOn(TurboModuleRegistry, 'get').mockReturnValue({
      getRandomBase64: () => 'AQIDBAUGBwgJCgsMDQ4PEA==',
    } as never);
    expect(Array.from(secureRandomBytes(16))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ]);
  });

  test('rejects malformed and all-zero native responses', () => {
    const spy = jest.spyOn(TurboModuleRegistry, 'get');
    spy.mockReturnValue({ getRandomBase64: () => 'AAAA' } as never);
    expect(() => secureRandomBytes(16)).toThrow(SecureRandomError);
    spy.mockReturnValue({
      getRandomBase64: () => 'AAAAAAAAAAAAAAAAAAAAAA==',
    } as never);
    expect(() => secureRandomBytes(16)).toThrow(SecureRandomError);
  });

  test('produces RFC 4122 version 4 identifiers', () => {
    const id = randomUuid(sequenceRandom([0xab]));
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  test('uses rejection sampling for bounded indexes', () => {
    expect(randomIndex(3, sequenceRandom([0xff, 0xff, 0x00, 0x05]))).toBe(2);
    expect(() => randomIndex(0, sequenceRandom([1]))).toThrow(RangeError);
  });
});

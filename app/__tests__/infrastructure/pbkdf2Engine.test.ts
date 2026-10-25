import { nodePbkdf2Engine } from '../../testing/nodeSqliteDatabase';
import {
  fromHex,
  toHex,
  utf8Encode,
} from '../../src/infrastructure/security/encoding';

const mockDerive = jest.fn();

jest.mock('../../src/infrastructure/native/NativeGfpCrypto', () => ({
  __esModule: true,
  default: { pbkdf2HmacSha256: (...args: unknown[]) => mockDerive(...args) },
}));

import {
  createNativePbkdf2Engine,
  MAX_PBKDF2_ITERATIONS,
} from '../../src/infrastructure/security/pbkdf2Engine';

const VECTORS = [
  [
    'passwd',
    'salt',
    1,
    64,
    '55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783',
  ],
  [
    'password',
    'salt',
    1,
    32,
    '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b',
  ],
  [
    'password',
    'salt',
    4096,
    32,
    'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a',
  ],
  [
    'passwordPASSWORDpassword',
    'saltSALTsaltSALTsaltSALTsaltSALTsalt',
    4096,
    40,
    '348c89dbcbd32b2f32d814b8116e84cf2b17347ebc1800181c4e2a1fb8dd53e1c635518c7dac47e9',
  ],
] as const;

describe('native PBKDF2 engine bridge', () => {
  beforeEach(() => {
    mockDerive.mockReset();
    mockDerive.mockImplementation(
      async (
        passwordHex: string,
        saltHex: string,
        iterations: number,
        length: number,
      ) =>
        toHex(
          await nodePbkdf2Engine.deriveHmacSha256(
            fromHex(passwordHex),
            fromHex(saltHex),
            iterations,
            length,
          ),
        ),
    );
  });

  test.each(VECTORS)(
    'reproduces reference vector %s/%s',
    async (password, salt, iterations, length, expected) => {
      const derived = await createNativePbkdf2Engine().deriveHmacSha256(
        utf8Encode(password),
        utf8Encode(salt),
        iterations,
        length,
      );
      expect(toHex(derived)).toBe(expected);
    },
  );

  test('sends exact UTF-8 bytes to the native module', async () => {
    await createNativePbkdf2Engine().deriveHmacSha256(
      utf8Encode('ñ'),
      utf8Encode('s'),
      1,
      32,
    );
    expect(mockDerive).toHaveBeenCalledWith('c3b1', '73', 1, 32);
  });

  test('rejects arguments outside the supported range before calling native code', async () => {
    const engine = createNativePbkdf2Engine();
    await expect(
      engine.deriveHmacSha256(utf8Encode('p'), utf8Encode('s'), 0, 32),
    ).rejects.toThrow(RangeError);
    await expect(
      engine.deriveHmacSha256(
        utf8Encode('p'),
        utf8Encode('s'),
        MAX_PBKDF2_ITERATIONS + 1,
        32,
      ),
    ).rejects.toThrow(RangeError);
    await expect(
      engine.deriveHmacSha256(utf8Encode('p'), new Uint8Array(0), 1, 32),
    ).rejects.toThrow(RangeError);
    expect(mockDerive).not.toHaveBeenCalled();
  });

  test('rejects a native result with the wrong length', async () => {
    mockDerive.mockResolvedValueOnce('00');
    await expect(
      createNativePbkdf2Engine().deriveHmacSha256(
        utf8Encode('p'),
        utf8Encode('s'),
        1,
        32,
      ),
    ).rejects.toThrow(RangeError);
  });
});

import NativeGfpCrypto from '../native/NativeGfpCrypto';
import { fromHex, toHex } from './encoding';

export const MAX_PBKDF2_ITERATIONS = 10_000_000;
export const MAX_DERIVED_KEY_BYTES = 64;

export interface Pbkdf2Engine {
  deriveHmacSha256(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLengthBytes: number,
  ): Promise<Uint8Array>;
}

export class Pbkdf2UnavailableError extends Error {
  constructor() {
    super('native PBKDF2 module GfpCrypto is not available');
    this.name = 'Pbkdf2UnavailableError';
  }
}

export function assertPbkdf2Arguments(
  salt: Uint8Array,
  iterations: number,
  keyLengthBytes: number,
): void {
  if (
    !Number.isSafeInteger(iterations) ||
    iterations < 1 ||
    iterations > MAX_PBKDF2_ITERATIONS
  ) {
    throw new RangeError(`invalid PBKDF2 iteration count: ${iterations}`);
  }
  if (
    !Number.isSafeInteger(keyLengthBytes) ||
    keyLengthBytes < 1 ||
    keyLengthBytes > MAX_DERIVED_KEY_BYTES
  ) {
    throw new RangeError(`invalid PBKDF2 key length: ${keyLengthBytes}`);
  }
  if (salt.length < 1) {
    throw new RangeError('PBKDF2 salt must not be empty');
  }
}

export function createNativePbkdf2Engine(): Pbkdf2Engine {
  return {
    async deriveHmacSha256(password, salt, iterations, keyLengthBytes) {
      assertPbkdf2Arguments(salt, iterations, keyLengthBytes);
      if (NativeGfpCrypto == null) {
        throw new Pbkdf2UnavailableError();
      }
      const derivedHex = await NativeGfpCrypto.pbkdf2HmacSha256(
        toHex(password),
        toHex(salt),
        iterations,
        keyLengthBytes,
      );
      const derived = fromHex(derivedHex);
      if (derived.length !== keyLengthBytes) {
        throw new RangeError('native PBKDF2 returned an unexpected length');
      }
      return derived;
    },
  };
}

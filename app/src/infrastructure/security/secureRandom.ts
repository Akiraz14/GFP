/* eslint-disable no-bitwise */
import { TurboModuleRegistry, type TurboModule } from 'react-native';
import { decodeBase64Strict } from './encoding';

export const NATIVE_RANDOM_MODULE_NAME = 'RNGetRandomValues';
export const MAX_RANDOM_BYTES = 65536;

interface NativeRandomModule extends TurboModule {
  getRandomBase64(byteLength: number): string;
}

export type SecureRandomFailure =
  | 'module_missing'
  | 'method_missing'
  | 'invalid_response'
  | 'all_zero';

export class SecureRandomError extends Error {
  readonly reason: SecureRandomFailure;

  constructor(reason: SecureRandomFailure) {
    super(`secure random source failed: ${reason}`);
    this.name = 'SecureRandomError';
    this.reason = reason;
  }
}

export type RandomBytesSource = (length: number) => Uint8Array;

function loadNativeRandomModule(): NativeRandomModule {
  const nativeModule = TurboModuleRegistry.get<NativeRandomModule>(
    NATIVE_RANDOM_MODULE_NAME,
  );
  if (nativeModule == null) {
    throw new SecureRandomError('module_missing');
  }
  if (typeof nativeModule.getRandomBase64 !== 'function') {
    throw new SecureRandomError('method_missing');
  }
  return nativeModule;
}

export const secureRandomBytes: RandomBytesSource = length => {
  if (
    !Number.isSafeInteger(length) ||
    length < 1 ||
    length > MAX_RANDOM_BYTES
  ) {
    throw new RangeError(`invalid random byte length: ${length}`);
  }
  const encoded: unknown = loadNativeRandomModule().getRandomBase64(length);
  if (
    typeof encoded !== 'string' ||
    encoded.length !== 4 * Math.ceil(length / 3)
  ) {
    throw new SecureRandomError('invalid_response');
  }
  let bytes: Uint8Array;
  try {
    bytes = decodeBase64Strict(encoded);
  } catch {
    throw new SecureRandomError('invalid_response');
  }
  if (bytes.length !== length) {
    throw new SecureRandomError('invalid_response');
  }
  if (length >= 16 && bytes.every(value => value === 0)) {
    throw new SecureRandomError('all_zero');
  }
  return bytes;
};

export function randomUuid(
  source: RandomBytesSource = secureRandomBytes,
): string {
  const bytes = source(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, value =>
    value.toString(16).padStart(2, '0'),
  ).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16,
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function randomIndex(
  exclusiveUpperBound: number,
  source: RandomBytesSource = secureRandomBytes,
): number {
  if (
    !Number.isSafeInteger(exclusiveUpperBound) ||
    exclusiveUpperBound < 1 ||
    exclusiveUpperBound > 0x10000
  ) {
    throw new RangeError(`invalid random bound: ${exclusiveUpperBound}`);
  }
  const limit = 0x10000 - (0x10000 % exclusiveUpperBound);
  for (;;) {
    const bytes = source(2);
    const value = (bytes[0] << 8) | bytes[1];
    if (value < limit) {
      return value % exclusiveUpperBound;
    }
  }
}

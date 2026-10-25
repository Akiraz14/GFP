/* eslint-disable no-bitwise */
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const SEXTET_BY_CHARACTER = new Map<string, number>(
  Array.from(BASE64_ALPHABET, (character, index) => [character, index]),
);

export class Base64DecodeError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`invalid base64: ${reason}`);
    this.name = 'Base64DecodeError';
    this.reason = reason;
  }
}

export function decodeBase64Strict(encoded: string): Uint8Array {
  if (encoded.length % 4 !== 0) {
    throw new Base64DecodeError('length');
  }
  let padding = 0;
  if (encoded.endsWith('==')) {
    padding = 2;
  } else if (encoded.endsWith('=')) {
    padding = 1;
  }
  const body = encoded.slice(0, encoded.length - padding);
  const output = new Uint8Array((encoded.length / 4) * 3 - padding);
  let buffer = 0;
  let bufferedBits = 0;
  let offset = 0;
  for (const character of body) {
    const sextet = SEXTET_BY_CHARACTER.get(character);
    if (sextet === undefined) {
      throw new Base64DecodeError('alphabet');
    }
    buffer = (buffer << 6) | sextet;
    bufferedBits += 6;
    if (bufferedBits >= 8) {
      bufferedBits -= 8;
      output[offset] = (buffer >> bufferedBits) & 0xff;
      offset += 1;
      buffer &= (1 << bufferedBits) - 1;
    }
  }
  if (offset !== output.length) {
    throw new Base64DecodeError('padding');
  }
  if (buffer !== 0) {
    throw new Base64DecodeError('non_canonical');
  }
  return output;
}

export function toHex(bytes: Uint8Array): string {
  return bytesToHex(bytes);
}

export function fromHex(hex: string): Uint8Array {
  return hexToBytes(hex);
}

export function utf8Encode(text: string): Uint8Array {
  return utf8ToBytes(text);
}

export function constantTimeEqual(
  left: Uint8Array,
  right: Uint8Array,
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export function wipe(bytes: Uint8Array): void {
  bytes.fill(0);
}

import {
  constantTimeEqual,
  utf8Encode,
  wipe,
} from '../../infrastructure/security/encoding';
import type { Pbkdf2Engine } from '../../infrastructure/security/pbkdf2Engine';
import {
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';
import {
  normalizeFreeTextAnswer,
  normalizeSecret,
} from './secretNormalization';

export const VERIFIER_ALGORITHM = 'pbkdf2-hmac-sha256';
export const VERIFIER_FORMAT_VERSION = 1;
export const SALT_BYTES = 16;
export const DERIVED_KEY_BYTES = 32;
export const PROVISIONAL_PBKDF2_ITERATIONS = 600_000;

export type SecretNormalization = 'nfc' | 'option-id' | 'free-text-folded';

export type VerifierParameters = {
  algorithm: typeof VERIFIER_ALGORITHM;
  iterations: number;
  formatVersion: number;
};

export type SecretVerifierRecord = VerifierParameters & {
  normalization: SecretNormalization;
  salt: Uint8Array;
  verifier: Uint8Array;
};

export const CURRENT_VERIFIER_PARAMETERS: VerifierParameters = {
  algorithm: VERIFIER_ALGORITHM,
  iterations: PROVISIONAL_PBKDF2_ITERATIONS,
  formatVersion: VERIFIER_FORMAT_VERSION,
};

export type SecretVerifierDependencies = {
  engine: Pbkdf2Engine;
  random?: RandomBytesSource;
  parameters?: VerifierParameters;
};

const OPTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class InvalidSecretInputError extends Error {
  constructor(reason: string) {
    super(`invalid secret input: ${reason}`);
    this.name = 'InvalidSecretInputError';
  }
}

export function canonicalSecret(
  secret: string,
  normalization: SecretNormalization,
): string {
  switch (normalization) {
    case 'nfc':
      return normalizeSecret(secret);
    case 'option-id':
      if (!OPTION_ID.test(secret)) {
        throw new InvalidSecretInputError('option_id');
      }
      return secret;
    case 'free-text-folded': {
      const folded = normalizeFreeTextAnswer(secret);
      if (folded.length === 0) {
        throw new InvalidSecretInputError('empty_answer');
      }
      return folded;
    }
  }
}

async function derive(
  engine: Pbkdf2Engine,
  canonical: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const password = utf8Encode(canonical);
  try {
    return await engine.deriveHmacSha256(
      password,
      salt,
      iterations,
      DERIVED_KEY_BYTES,
    );
  } finally {
    wipe(password);
  }
}

export async function createSecretVerifier(
  secret: string,
  normalization: SecretNormalization,
  dependencies: SecretVerifierDependencies,
): Promise<SecretVerifierRecord> {
  const parameters = dependencies.parameters ?? CURRENT_VERIFIER_PARAMETERS;
  const salt = (dependencies.random ?? secureRandomBytes)(SALT_BYTES);
  const verifier = await derive(
    dependencies.engine,
    canonicalSecret(secret, normalization),
    salt,
    parameters.iterations,
  );
  return { ...parameters, normalization, salt, verifier };
}

export async function verifySecret(
  candidate: string,
  record: SecretVerifierRecord,
  engine: Pbkdf2Engine,
): Promise<boolean> {
  if (
    record.algorithm !== VERIFIER_ALGORITHM ||
    record.formatVersion !== VERIFIER_FORMAT_VERSION ||
    record.salt.length !== SALT_BYTES ||
    record.verifier.length !== DERIVED_KEY_BYTES
  ) {
    throw new InvalidSecretInputError('unsupported_record');
  }
  let canonical: string;
  try {
    canonical = canonicalSecret(candidate, record.normalization);
  } catch (error) {
    if (error instanceof InvalidSecretInputError) {
      await derive(
        engine,
        'gfp-invalid-candidate',
        record.salt,
        record.iterations,
      );
      return false;
    }
    throw error;
  }
  const derived = await derive(
    engine,
    canonical,
    record.salt,
    record.iterations,
  );
  try {
    return constantTimeEqual(derived, record.verifier);
  } finally {
    wipe(derived);
  }
}

export function needsRehash(
  record: SecretVerifierRecord,
  parameters: VerifierParameters = CURRENT_VERIFIER_PARAMETERS,
): boolean {
  return (
    record.algorithm !== parameters.algorithm ||
    record.iterations !== parameters.iterations ||
    record.formatVersion !== parameters.formatVersion
  );
}

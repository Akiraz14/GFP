import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../../testing/nodeSqliteDatabase';
import { toHex } from '../../../src/infrastructure/security/encoding';
import {
  CURRENT_VERIFIER_PARAMETERS,
  createSecretVerifier,
  DERIVED_KEY_BYTES,
  InvalidSecretInputError,
  needsRehash,
  PROVISIONAL_PBKDF2_ITERATIONS,
  SALT_BYTES,
  verifySecret,
  type VerifierParameters,
} from '../../../src/services/authentication/secretVerifier';

const FAST: VerifierParameters = {
  ...CURRENT_VERIFIER_PARAMETERS,
  iterations: 1000,
};
const deps = {
  engine: nodePbkdf2Engine,
  random: nodeRandomBytes,
  parameters: FAST,
};

describe('secret verifier (E02-D1)', () => {
  test('stores algorithm, parameters, salt, verifier and format version', async () => {
    const record = await createSecretVerifier('Clave123!', 'nfc', deps);
    expect(record).toMatchObject({
      algorithm: 'pbkdf2-hmac-sha256',
      iterations: 1000,
      formatVersion: 1,
      normalization: 'nfc',
    });
    expect(record.salt).toHaveLength(SALT_BYTES);
    expect(record.verifier).toHaveLength(DERIVED_KEY_BYTES);
  });

  test('uses the provisional production iteration count by default', () => {
    expect(CURRENT_VERIFIER_PARAMETERS.iterations).toBe(
      PROVISIONAL_PBKDF2_ITERATIONS,
    );
    expect(PROVISIONAL_PBKDF2_ITERATIONS).toBe(600000);
  });

  test('verifies the same password and NFD equivalents, nothing else', async () => {
    const record = await createSecretVerifier('Contraseña 1!', 'nfc', deps);
    await expect(
      verifySecret('Contraseña 1!', record, nodePbkdf2Engine),
    ).resolves.toBe(true);
    await expect(
      verifySecret('Contraseña 1!', record, nodePbkdf2Engine),
    ).resolves.toBe(true);
    await expect(
      verifySecret('contraseña 1!', record, nodePbkdf2Engine),
    ).resolves.toBe(false);
    await expect(
      verifySecret('Contraseña1!', record, nodePbkdf2Engine),
    ).resolves.toBe(false);
    await expect(
      verifySecret('Contraseña 1! ', record, nodePbkdf2Engine),
    ).resolves.toBe(false);
  });

  test('derives independent verifiers for identical secrets', async () => {
    const first = await createSecretVerifier('blue', 'option-id', deps);
    const second = await createSecretVerifier('blue', 'option-id', deps);
    expect(toHex(first.salt)).not.toBe(toHex(second.salt));
    expect(toHex(first.verifier)).not.toBe(toHex(second.verifier));
  });

  test('treats malformed option answers as a failed verification', async () => {
    const record = await createSecretVerifier('blue', 'option-id', deps);
    await expect(verifySecret('Blue', record, nodePbkdf2Engine)).resolves.toBe(
      false,
    );
    await expect(verifySecret('', record, nodePbkdf2Engine)).resolves.toBe(
      false,
    );
    await expect(
      createSecretVerifier('Blue', 'option-id', deps),
    ).rejects.toThrow(InvalidSecretInputError);
  });

  test('rejects unsupported stored records instead of guessing', async () => {
    const record = await createSecretVerifier('blue', 'option-id', deps);
    await expect(
      verifySecret('blue', { ...record, formatVersion: 2 }, nodePbkdf2Engine),
    ).rejects.toThrow(InvalidSecretInputError);
  });

  test('flags records created with other parameters for rehash', async () => {
    const record = await createSecretVerifier('blue', 'option-id', deps);
    expect(needsRehash(record, FAST)).toBe(false);
    expect(needsRehash(record)).toBe(true);
  });
});

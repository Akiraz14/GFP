package co.gfpsas.gestionfinanciera.crypto;

import java.security.GeneralSecurityException;
import java.util.Arrays;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class Pbkdf2HmacSha256 {
  public static final int MAX_ITERATIONS = 10_000_000;
  public static final int MAX_KEY_LENGTH_BYTES = 64;
  private static final int HASH_LENGTH_BYTES = 32;

  private Pbkdf2HmacSha256() {}

  public static byte[] derive(byte[] password, byte[] salt, int iterations, int keyLengthBytes)
      throws GeneralSecurityException {
    if (password == null || password.length == 0 || salt == null || salt.length == 0) {
      throw new IllegalArgumentException("a non-empty password and salt are required");
    }
    if (iterations < 1 || iterations > MAX_ITERATIONS) {
      throw new IllegalArgumentException("invalid iteration count");
    }
    if (keyLengthBytes < 1 || keyLengthBytes > MAX_KEY_LENGTH_BYTES) {
      throw new IllegalArgumentException("invalid key length");
    }
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(password, "HmacSHA256"));
    byte[] output = new byte[keyLengthBytes];
    byte[] block = new byte[HASH_LENGTH_BYTES];
    byte[] accumulator = new byte[HASH_LENGTH_BYTES];
    int blocks = (keyLengthBytes + HASH_LENGTH_BYTES - 1) / HASH_LENGTH_BYTES;
    try {
      for (int blockIndex = 1; blockIndex <= blocks; blockIndex++) {
        mac.update(salt);
        mac.update((byte) (blockIndex >>> 24));
        mac.update((byte) (blockIndex >>> 16));
        mac.update((byte) (blockIndex >>> 8));
        mac.update((byte) blockIndex);
        mac.doFinal(block, 0);
        System.arraycopy(block, 0, accumulator, 0, HASH_LENGTH_BYTES);
        for (int iteration = 1; iteration < iterations; iteration++) {
          mac.update(block);
          mac.doFinal(block, 0);
          for (int index = 0; index < HASH_LENGTH_BYTES; index++) {
            accumulator[index] ^= block[index];
          }
        }
        int offset = (blockIndex - 1) * HASH_LENGTH_BYTES;
        System.arraycopy(
            accumulator, 0, output, offset, Math.min(HASH_LENGTH_BYTES, keyLengthBytes - offset));
      }
      return output;
    } finally {
      Arrays.fill(block, (byte) 0);
      Arrays.fill(accumulator, (byte) 0);
    }
  }
}

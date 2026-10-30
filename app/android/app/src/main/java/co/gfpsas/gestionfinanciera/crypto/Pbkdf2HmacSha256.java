package co.gfpsas.gestionfinanciera.crypto;

import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public final class Pbkdf2HmacSha256 {
  public static final String ALGORITHM = "PBKDF2WithHmacSHA256";
  public static final int MAX_ITERATIONS = 10_000_000;
  public static final int MAX_KEY_LENGTH_BYTES = 64;

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
    SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
    char[] characters = decodeUtf8(password);
    PBEKeySpec spec = new PBEKeySpec(characters, salt, iterations, keyLengthBytes * 8);
    try {
      byte[] derived = factory.generateSecret(spec).getEncoded();
      if (derived == null || derived.length != keyLengthBytes) {
        if (derived != null) {
          Arrays.fill(derived, (byte) 0);
        }
        throw new GeneralSecurityException("unexpected derived key length");
      }
      return derived;
    } finally {
      spec.clearPassword();
      Arrays.fill(characters, '\0');
    }
  }

  static char[] decodeUtf8(byte[] bytes) {
    CharBuffer buffer;
    try {
      buffer =
          StandardCharsets.UTF_8
              .newDecoder()
              .onMalformedInput(CodingErrorAction.REPORT)
              .onUnmappableCharacter(CodingErrorAction.REPORT)
              .decode(ByteBuffer.wrap(bytes));
    } catch (CharacterCodingException error) {
      throw new IllegalArgumentException("password is not valid UTF-8");
    }
    char[] characters = new char[buffer.remaining()];
    buffer.get(characters);
    if (buffer.hasArray()) {
      Arrays.fill(buffer.array(), '\0');
    }
    return characters;
  }
}

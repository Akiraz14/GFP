package co.gfpsas.gestionfinanciera.crypto;

public final class HexCodec {
  private static final char[] DIGITS = "0123456789abcdef".toCharArray();

  private HexCodec() {}

  public static byte[] decode(String hex) {
    if (hex == null || hex.length() % 2 != 0) {
      throw new IllegalArgumentException("hex input must have an even length");
    }
    byte[] output = new byte[hex.length() / 2];
    for (int index = 0; index < output.length; index++) {
      int high = Character.digit(hex.charAt(2 * index), 16);
      int low = Character.digit(hex.charAt(2 * index + 1), 16);
      if (high < 0 || low < 0) {
        throw new IllegalArgumentException("invalid hex digit");
      }
      output[index] = (byte) ((high << 4) | low);
    }
    return output;
  }

  public static String encode(byte[] bytes) {
    char[] output = new char[bytes.length * 2];
    for (int index = 0; index < bytes.length; index++) {
      output[2 * index] = DIGITS[(bytes[index] >>> 4) & 0x0f];
      output[2 * index + 1] = DIGITS[bytes[index] & 0x0f];
    }
    return new String(output);
  }
}

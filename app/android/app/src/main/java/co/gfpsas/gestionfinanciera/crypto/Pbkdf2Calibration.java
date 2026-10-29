package co.gfpsas.gestionfinanciera.crypto;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public final class Pbkdf2Calibration {
  private static final String[][] VECTORS = {
    {"V1", "passwd", "salt", "1", "64",
      "55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc"
          + "49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783"},
    {"V4", "password", "salt", "1", "32",
      "120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b"},
    {"V5", "password", "salt", "4096", "32",
      "c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a"},
    {"V6", "passwordPASSWORDpassword", "saltSALTsaltSALTsaltSALTsaltSALTsalt", "4096", "40",
      "348c89dbcbd32b2f32d814b8116e84cf2b17347ebc1800181c4e2a1fb8dd53e1c635518c7dac47e9"},
    {"V7", "contrase\u00f1a-\u00f1\u20ac\u2713", "sal-\u00f1-0001", "600000", "32",
      "4cff0013b242c0afbee327b6bfc8a603e3171e9073794380051563880abb066f"},
    {"U1", "Contrase\u00f1a-Jos\u00e9!1", "sal-u1", "4096", "32",
      "283759da08ad9e5c6a664b82aae6dadf512e68892624044a5ed9030489e77488"},
    {"U2", "Jos\u00e9 Mar\u00eda \u00d1and\u00fa", "sal-u2", "4096", "32",
      "f6d4010d309db6891dea9a9b3348eb07c173aa6537065919bef3da720f457e93"},
    {"U3", "Jose\u0301 Mari\u0301a N\u0303andu\u0301", "sal-u2", "4096", "32",
      "b3e4c52d4a72da340606bb372ef72ce87caa447b67ba9c62c1cc45582e7ed170"},
    {"U4", "clave\ud83d\ude00\ud83c\udde8\ud83c\uddf4!", "sal-u4", "4096", "32",
      "1fbc3accdc721fed0f9998753ddd6aa4017bc3ab5311f74a8adcffda4b492b39"},
    {"U5", "\u5bc6\u7801\u30d1\u30b9\uc554\ud638!9", "sal-u5", "4096", "32",
      "8214d2de28cfa9f1163efb26fe8a368153baed3de664b5027159c96ce20d103f"},
    {"U6", "pena bogota", "sal-u6", "4096", "32",
      "ea0092dbb132544e2e581040fe18902cfdc5779cbcf325424746a5efa6f0264d"},
    {"U7", "a\u0301\u0302\u0323z", "sal-u7", "4096", "32",
      "bfe4941d067c4091f268562dd6b0ddc9c4777f5e064b470f9d16e34b35bf693b"},
    {"U8", "contrase\u00f1a\ud83d\ude00", "sal-u8", "600000", "32",
      "58eddde93cac0456fcff6020c116e03b079c06783ad50434055a26835fc06ed5"},
  };

  private Pbkdf2Calibration() {}

  private static boolean rejects(byte[] password, byte[] salt, int iterations, int keyLength) {
    try {
      Pbkdf2HmacSha256.derive(password, salt, iterations, keyLength);
      return false;
    } catch (IllegalArgumentException expected) {
      return true;
    } catch (Exception unexpected) {
      return false;
    }
  }

  private static int check(String name, boolean passed) {
    System.out.println("GFP-PBKDF2|check|" + name + "|" + (passed ? "OK" : "FAIL"));
    return passed ? 0 : 1;
  }

  public static void main(String[] args) throws Exception {
    int iterations = args.length > 0 ? Integer.parseInt(args[0]) : 600_000;
    int samples = args.length > 1 ? Integer.parseInt(args[1]) : 5;
    if (samples < 1 || samples > 50) {
      throw new IllegalArgumentException("samples must be between 1 and 50");
    }
    int failures = 0;
    for (String[] vector : VECTORS) {
      byte[] derived =
          Pbkdf2HmacSha256.derive(
              vector[1].getBytes(StandardCharsets.UTF_8),
              vector[2].getBytes(StandardCharsets.UTF_8),
              Integer.parseInt(vector[3]),
              Integer.parseInt(vector[4]));
      boolean matches = HexCodec.encode(derived).equals(vector[5]);
      if (!matches) {
        failures++;
      }
      System.out.println("GFP-PBKDF2|vector|" + vector[0] + "|" + (matches ? "OK" : "FAIL"));
    }
    System.out.println("GFP-PBKDF2|vectors_result|" + (failures == 0 ? "OK" : "FAIL") + "|failed=" + failures);
    byte[] checkSalt = "salt".getBytes(StandardCharsets.UTF_8);
    int checkFailures = 0;
    checkFailures += check("rejects-malformed-utf8", rejects(new byte[] {0x61, (byte) 0xC3, 0x28, 0x62}, checkSalt, 10, 32));
    checkFailures += check("rejects-empty-password", rejects(new byte[0], checkSalt, 10, 32));
    checkFailures += check("rejects-empty-salt", rejects(new byte[] {0x61}, new byte[0], 10, 32));
    checkFailures += check("rejects-zero-iterations", rejects(new byte[] {0x61}, checkSalt, 0, 32));
    checkFailures += check("rejects-key-length-65", rejects(new byte[] {0x61}, checkSalt, 10, 65));
    byte[] right = Pbkdf2HmacSha256.derive("password".getBytes(StandardCharsets.UTF_8), checkSalt, 4096, 32);
    byte[] wrong = Pbkdf2HmacSha256.derive("passwore".getBytes(StandardCharsets.UTF_8), checkSalt, 4096, 32);
    checkFailures += check("wrong-password-differs", !java.security.MessageDigest.isEqual(right, wrong));
    System.out.println("GFP-PBKDF2|checks_result|" + (checkFailures == 0 ? "OK" : "FAIL") + "|failed=" + checkFailures);
    failures += checkFailures;
    byte[] password = "GFP-calibration-password".getBytes(StandardCharsets.UTF_8);
    byte[] salt = new byte[16];
    Pbkdf2HmacSha256.derive(password, salt, 1000, 32);
    long[] durations = new long[samples];
    for (int sample = 0; sample < samples; sample++) {
      salt[0] = (byte) sample;
      long startedAt = System.nanoTime();
      Pbkdf2HmacSha256.derive(password, salt, iterations, 32);
      durations[sample] = (System.nanoTime() - startedAt) / 1_000_000L;
      System.out.println(
          "GFP-PBKDF2|sample|iterations=" + iterations + "|index=" + (sample + 1) + "|ms=" + durations[sample]);
    }
    long[] sorted = durations.clone();
    Arrays.sort(sorted);
    System.out.println(
        "GFP-PBKDF2|summary|iterations=" + iterations + "|samples=" + samples + "|medianMs="
            + sorted[samples / 2] + "|minMs=" + sorted[0] + "|maxMs=" + sorted[samples - 1]
            + "|provider=" + javax.crypto.SecretKeyFactory.getInstance(Pbkdf2HmacSha256.ALGORITHM).getProvider().getName());
    System.exit(failures == 0 ? 0 : 1);
  }
}

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
  };

  private Pbkdf2Calibration() {}

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
            + "|provider=" + javax.crypto.Mac.getInstance("HmacSHA256").getProvider().getName());
    System.exit(failures == 0 ? 0 : 1);
  }
}

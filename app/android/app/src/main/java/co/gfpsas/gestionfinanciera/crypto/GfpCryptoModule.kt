package co.gfpsas.gestionfinanciera.crypto

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import co.gfpsas.gestionfinanciera.specs.NativeGfpCryptoSpec
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class GfpCryptoModule(reactContext: ReactApplicationContext) : NativeGfpCryptoSpec(reactContext) {

  private val executor: ExecutorService =
    Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors().coerceIn(1, 4))

  override fun pbkdf2HmacSha256(
    passwordHex: String,
    saltHex: String,
    iterations: Double,
    keyLengthBytes: Double,
    promise: Promise,
  ) {
    val iterationCount = iterations.toInt()
    val keyLength = keyLengthBytes.toInt()
    if (iterationCount.toDouble() != iterations || keyLength.toDouble() != keyLengthBytes) {
      promise.reject(ERROR_CODE, "PBKDF2 arguments must be integers")
      return
    }
    executor.execute {
      var password = ByteArray(0)
      var salt = ByteArray(0)
      var derived = ByteArray(0)
      try {
        password = HexCodec.decode(passwordHex)
        salt = HexCodec.decode(saltHex)
        derived = Pbkdf2HmacSha256.derive(password, salt, iterationCount, keyLength)
        promise.resolve(HexCodec.encode(derived))
      } catch (error: Exception) {
        promise.reject(ERROR_CODE, error.javaClass.simpleName)
      } finally {
        password.fill(0)
        salt.fill(0)
        derived.fill(0)
      }
    }
  }

  override fun invalidate() {
    executor.shutdown()
    super.invalidate()
  }

  companion object {
    const val NAME = NativeGfpCryptoSpec.NAME
    private const val ERROR_CODE = "E_GFP_PBKDF2"
  }
}

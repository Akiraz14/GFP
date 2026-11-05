package co.gfpsas.gestionfinanciera.files

import android.net.Uri
import co.gfpsas.gestionfinanciera.specs.NativeGfpFilesSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import java.io.File

// HU7: la foto del comprobante no se conserva. react-native-image-picker copia la imagen en
// la caché de la app con el prefijo TEMP_PREFIX; este módulo solo borra esos archivos.
class GfpFilesModule(reactContext: ReactApplicationContext) : NativeGfpFilesSpec(reactContext) {

  override fun deleteTemporaryImage(uri: String, promise: Promise) {
    try {
      val file = temporaryImage(uri)
      promise.resolve(file != null && file.exists() && file.delete())
    } catch (error: Exception) {
      promise.reject(ERROR_CODE, error.javaClass.simpleName)
    }
  }

  override fun clearTemporaryImages(promise: Promise) {
    try {
      val files = cacheDirectory().listFiles { file ->
        file.isFile && file.name.startsWith(TEMP_PREFIX)
      } ?: emptyArray()
      promise.resolve(files.count { it.delete() }.toDouble())
    } catch (error: Exception) {
      promise.reject(ERROR_CODE, error.javaClass.simpleName)
    }
  }

  private fun cacheDirectory(): File = reactApplicationContext.cacheDir.canonicalFile

  // Solo un archivo `file://` directamente dentro de la caché y con el prefijo de la biblioteca.
  private fun temporaryImage(uri: String): File? {
    val parsed = Uri.parse(uri)
    if (parsed.scheme != "file") {
      return null
    }
    val path = parsed.path ?: return null
    val file = File(path).canonicalFile
    return if (file.parentFile == cacheDirectory() && file.name.startsWith(TEMP_PREFIX)) {
      file
    } else {
      null
    }
  }

  companion object {
    const val NAME = NativeGfpFilesSpec.NAME
    const val TEMP_PREFIX = "rn_image_picker_lib_temp_"
    private const val ERROR_CODE = "E_GFP_FILES"
  }
}

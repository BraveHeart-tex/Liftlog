package expo.modules.liftlogupdater

import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.security.MessageDigest

internal object ApkVerificationHelper {
  fun sha256(file: File): String = FileInputStream(file).use(::sha256)

  fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256").digest(bytes).hex()

  private fun sha256(input: InputStream): String {
    val digest = MessageDigest.getInstance("SHA-256")
    val buffer = ByteArray(64 * 1024)
    while (true) {
      val count = input.read(buffer)
      if (count < 0) break
      digest.update(buffer, 0, count)
    }
    return digest.digest().hex()
  }

  private fun ByteArray.hex(): String = joinToString("") { "%02x".format(it.toInt() and 0xff) }
}

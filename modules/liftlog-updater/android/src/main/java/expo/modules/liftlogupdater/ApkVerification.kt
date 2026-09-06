package expo.modules.liftlogupdater

import java.io.InputStream
import java.security.MessageDigest

internal data class StreamDigest(val sizeBytes: Long, val sha256: String)

internal object ApkVerification {
  fun digest(input: InputStream): StreamDigest {
    val digest = MessageDigest.getInstance("SHA-256")
    val buffer = ByteArray(64 * 1024)
    var total = 0L

    while (true) {
      val count = input.read(buffer)
      if (count < 0) break
      digest.update(buffer, 0, count)
      total += count
    }

    return StreamDigest(total, digest.digest().joinToString("") { "%02x".format(it.toInt() and 0xff) })
  }
}

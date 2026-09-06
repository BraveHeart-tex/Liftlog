package expo.modules.liftlogupdater

import java.io.InputStream
import java.io.OutputStream

internal class TeeInputStreamCompat(
  private val source: InputStream,
  private val branch: OutputStream
) : InputStream() {
  override fun read(): Int = source.read().also { if (it >= 0) branch.write(it) }

  override fun read(buffer: ByteArray, offset: Int, length: Int): Int =
    source.read(buffer, offset, length).also { count ->
      if (count > 0) branch.write(buffer, offset, count)
    }
}

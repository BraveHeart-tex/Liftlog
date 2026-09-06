package expo.modules.liftlogupdater

import java.io.ByteArrayInputStream
import org.junit.Assert.assertEquals
import org.junit.Test

class ApkVerificationTest {
  @Test
  fun `stream digest reports exact size and sha256`() {
    val result = ApkVerification.digest(ByteArrayInputStream("LiftLog".toByteArray()))

    assertEquals(7, result.sizeBytes)
    assertEquals("f26ac6dc634647fbd0234deb44addfaa15ef989df34bb050a769a278fa2ca807", result.sha256)
  }
}

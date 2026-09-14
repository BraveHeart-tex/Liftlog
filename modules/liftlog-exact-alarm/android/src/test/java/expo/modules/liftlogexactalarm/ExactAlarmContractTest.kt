package expo.modules.liftlogexactalarm

import android.os.Build
import android.provider.Settings
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ExactAlarmContractTest {
  @Test
  fun `older Android does not require exact alarm access`() {
    val access = ExactAlarmContract.access(Build.VERSION_CODES.R, false)

    assertFalse(access.supported)
    assertTrue(access.granted)
  }

  @Test
  fun `Android 12 reports exact alarm manager availability`() {
    assertEquals(
      ExactAlarmAccess(supported = true, granted = false),
      ExactAlarmContract.access(Build.VERSION_CODES.S, false)
    )
    assertEquals(
      ExactAlarmAccess(supported = true, granted = true),
      ExactAlarmContract.access(Build.VERSION_CODES.S, true)
    )
  }

  @Test
  fun `exact alarm settings target this application`() {
    val intent = ExactAlarmContract.exactAlarmSettingsIntent(
      Build.VERSION_CODES.S,
      "com.example.liftlog"
    )

    assertEquals(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, intent?.action)
    assertEquals("package:com.example.liftlog", intent?.data)
  }

  @Test
  fun `older Android has no exact alarm settings intent`() {
    assertEquals(
      null,
      ExactAlarmContract.exactAlarmSettingsIntent(
        Build.VERSION_CODES.R,
        "com.example.liftlog"
      )
    )
  }

  @Test
  fun `notification settings target the rest timer channel`() {
    val intent = ExactAlarmContract.notificationChannelSettingsIntent(
      "com.example.liftlog",
      "rest-timer-v2"
    )

    assertEquals(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS, intent.action)
    assertEquals(
      "com.example.liftlog",
      intent.extras[Settings.EXTRA_APP_PACKAGE]
    )
    assertEquals("rest-timer-v2", intent.extras[Settings.EXTRA_CHANNEL_ID])
  }
}

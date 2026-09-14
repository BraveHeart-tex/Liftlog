package expo.modules.liftlogexactalarm

import android.os.Build
import android.provider.Settings

data class ExactAlarmAccess(val supported: Boolean, val granted: Boolean)
data class SettingsIntentSpec(
  val action: String,
  val data: String? = null,
  val extras: Map<String, String> = emptyMap()
)

object ExactAlarmContract {
  fun access(sdkInt: Int, canScheduleExactAlarms: Boolean): ExactAlarmAccess {
    val supported = sdkInt >= Build.VERSION_CODES.S

    return ExactAlarmAccess(
      supported = supported,
      granted = !supported || canScheduleExactAlarms
    )
  }

  fun exactAlarmSettingsIntent(
    sdkInt: Int,
    packageName: String
  ): SettingsIntentSpec? {
    if (sdkInt < Build.VERSION_CODES.S) {
      return null
    }

    return SettingsIntentSpec(
      action = Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
      data = "package:$packageName"
    )
  }

  fun notificationChannelSettingsIntent(
    packageName: String,
    channelId: String
  ) = SettingsIntentSpec(
    action = Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS,
    extras = mapOf(
      Settings.EXTRA_APP_PACKAGE to packageName,
      Settings.EXTRA_CHANNEL_ID to channelId
    )
  )
}

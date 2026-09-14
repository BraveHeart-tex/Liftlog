package expo.modules.liftlogexactalarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LiftlogExactAlarmModule : Module() {
  private val context: Context
    get() = appContext.reactContext
      ?: throw IllegalStateException("Application context is unavailable")

  private fun openSettings(spec: SettingsIntentSpec) {
    context.startActivity(Intent(spec.action).apply {
      spec.data?.let { data = Uri.parse(it) }
      spec.extras.forEach { (key, value) -> putExtra(key, value) }
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    })
  }

  override fun definition() = ModuleDefinition {
    Name("LiftlogExactAlarm")

    Function("getAccess") {
      val canScheduleExactAlarms = Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
        context.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()
      val access = ExactAlarmContract.access(
        Build.VERSION.SDK_INT,
        canScheduleExactAlarms
      )

      mapOf("supported" to access.supported, "granted" to access.granted)
    }

    Function("openSettings") {
      ExactAlarmContract.exactAlarmSettingsIntent(
        Build.VERSION.SDK_INT,
        context.packageName
      )?.let(::openSettings)
    }

    Function("openNotificationChannelSettings") { channelId: String ->
      openSettings(
        ExactAlarmContract.notificationChannelSettingsIntent(
          context.packageName,
          channelId
        )
      )
    }
  }
}

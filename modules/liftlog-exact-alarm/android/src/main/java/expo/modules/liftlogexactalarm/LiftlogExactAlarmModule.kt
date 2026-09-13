package expo.modules.liftlogexactalarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LiftlogExactAlarmModule : Module() {
  private val context: Context
    get() = appContext.reactContext
      ?: throw IllegalStateException("Application context is unavailable")

  override fun definition() = ModuleDefinition {
    Name("LiftlogExactAlarm")

    Function("getAccess") {
      val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
      val granted = !supported ||
        context.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()

      mapOf("supported" to supported, "granted" to granted)
    }

    Function("openSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
          data = Uri.parse("package:${context.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
      }
    }
  }
}

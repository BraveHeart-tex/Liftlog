package expo.modules.liftlogupdater

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import android.os.Bundle

class InstallationResultReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val preferences = context.getSharedPreferences(LiftlogUpdaterModule.PREFERENCES, Context.MODE_PRIVATE)
    val status = intent.getIntExtra("android.content.pm.extra.STATUS", -1)
    val sessionId = preferences.getInt(LiftlogUpdaterModule.SESSION_ID, -1)
    val versionCode = preferences.getLong(LiftlogUpdaterModule.INTENDED_VERSION_CODE, -1L)
    val verifiedFile = preferences.getString(LiftlogUpdaterModule.VERIFIED_FILE, null)
    val editor = preferences.edit().remove(LiftlogUpdaterModule.PENDING_ACTION).remove(LiftlogUpdaterModule.ERROR_MESSAGE)

    when (status) {
      0 -> editor.putString(LiftlogUpdaterModule.STATE, "succeeded")
      -1 -> {
        val pendingIntent = if (Build.VERSION.SDK_INT >= 33) {
          intent.getParcelableExtra("android.intent.extra.INTENT", Intent::class.java)
        } else {
          @Suppress("DEPRECATION") intent.getParcelableExtra("android.intent.extra.INTENT")
        }
        if (pendingIntent != null) {
          editor.putString(LiftlogUpdaterModule.STATE, "pending_user_action")
            .putString(
              LiftlogUpdaterModule.PENDING_ACTION,
              pendingIntent.toUri(Intent.URI_INTENT_SCHEME)
            )
        }
      }
      PackageInstaller.STATUS_FAILURE_ABORTED -> editor.putString(LiftlogUpdaterModule.STATE, "cancelled")
        .putString(LiftlogUpdaterModule.ERROR_CODE, "installation_cancelled")
      PackageInstaller.STATUS_FAILURE_STORAGE -> editor.putString(LiftlogUpdaterModule.STATE, "failed")
        .putString(LiftlogUpdaterModule.ERROR_CODE, "storage_failure")
      PackageInstaller.STATUS_FAILURE_INCOMPATIBLE -> editor.putString(LiftlogUpdaterModule.STATE, "failed")
        .putString(LiftlogUpdaterModule.ERROR_CODE, "incompatible_apk")
      else -> editor.putString(LiftlogUpdaterModule.STATE, "failed")
        .putString(LiftlogUpdaterModule.ERROR_CODE, "installation_failure")
        .putString(
          LiftlogUpdaterModule.ERROR_MESSAGE,
          intent.getStringExtra("android.content.pm.extra.STATUS_MESSAGE") ?: "Installation failed"
        )
    }

    if (status != PackageInstaller.STATUS_PENDING_USER_ACTION) {
      verifiedFile?.let { java.io.File(it).delete() }
      editor.remove(LiftlogUpdaterModule.VERIFIED_FILE)
        .remove(LiftlogUpdaterModule.VERIFIED_HASH)
        .remove(LiftlogUpdaterModule.VERIFIED_VERSION_CODE)
        .remove(LiftlogUpdaterModule.SESSION_ID)
        .remove(LiftlogUpdaterModule.INTENDED_VERSION_CODE)
    }
    editor.apply()
    LiftlogUpdaterModule.notifyStatusChanged(context, sessionId, versionCode)
  }
}

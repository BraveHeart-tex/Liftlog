package expo.modules.liftlogupdater

import android.Manifest
import android.app.ActivityManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import java.io.File
import java.nio.file.Files
import java.util.UUID

class InstallationResultReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val store = DurableUpdateStore(context)
    val callbackAttemptId = intent.getStringExtra(UpdaterContract.EXTRA_ATTEMPT_ID)
    val callbackSessionId = intent.getIntExtra(UpdaterContract.EXTRA_SESSION_ID, -1)
    if (!UpdateTransitions.acceptsCallback(store.attemptId(), store.sessionId(), callbackAttemptId, callbackSessionId)) {
      return
    }

    when (intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)) {
      PackageInstaller.STATUS_PENDING_USER_ACTION -> {
        store.markPendingConfirmation()
        continuationIntent(intent)?.let { continuation ->
          if (!launchWhileForeground(context, continuation)) {
            PendingConfirmationRegistry.hold(callbackAttemptId!!, continuation)
            postContinuationNotification(context, callbackSessionId, continuation)
          }
        } ?: run {
          appendFailureDiagnostic(
            store,
            intent,
            callbackAttemptId!!,
            PackageInstaller.STATUS_PENDING_USER_ACTION,
            "UPDATER_CONFIRMATION_MISSING"
          )
          store.finish(UpdateStage.FAILED, "UPDATER_CONFIRMATION_MISSING")
        }
      }
      PackageInstaller.STATUS_SUCCESS -> {
        // Commit callbacks are not proof of installation. Reconciliation owns success.
        store.setStage(UpdateStage.COMMITTED)
      }
      else -> {
        val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
        val terminal = InstallerStatusMapping.terminal(status)
        if (terminal.stage == UpdateStage.FAILED) {
          appendFailureDiagnostic(store, intent, callbackAttemptId!!, status, terminal.code)
        }
        store.finish(terminal.stage, terminal.code)
      }
    }
    if (store.stage().isTerminal) deleteOwnedArtifact(context, store)
  }

  private fun appendFailureDiagnostic(
    store: DurableUpdateStore,
    intent: Intent,
    attemptId: String,
    status: Int,
    resultCode: String
  ) {
    runCatching {
      InstallerDiagnosticFactory.create(
        attemptId = attemptId,
        nativeStage = store.stage(),
        targetVersionName = store.targetVersionName(),
        targetVersionCode = store.targetVersionCode(),
        status = status,
        statusMessage = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE),
        blockingPackage = intent.getStringExtra(PackageInstaller.EXTRA_OTHER_PACKAGE_NAME),
        storagePath = intent.getStringExtra(PackageInstaller.EXTRA_STORAGE_PATH),
        diagnosticId = UUID.randomUUID().toString(),
        occurredAtMillis = System.currentTimeMillis(),
        resultCode = resultCode
      )?.let(store::appendDiagnostic)
    }.onFailure { error ->
      Log.e(TAG, "Failed to persist sanitized update diagnostic", error)
    }
  }

  private fun deleteOwnedArtifact(context: Context, store: DurableUpdateStore) {
    val directory = File(context.cacheDir, UpdaterContract.CACHE_DIRECTORY).canonicalFile
    store.filePath()?.let(::File)?.let { file ->
      if (!Files.isSymbolicLink(file.toPath()) && file.canonicalFile.parentFile == directory) {
        file.delete()
      }
    }
  }

  private fun continuationIntent(callback: Intent): Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    callback.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
  } else {
    @Suppress("DEPRECATION") callback.getParcelableExtra(Intent.EXTRA_INTENT)
  }

  private fun launchWhileForeground(context: Context, continuation: Intent): Boolean {
    val process = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(process)
    if (process.importance > ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) return false
    return runCatching {
      context.startActivity(continuation.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      true
    }.getOrDefault(false)
  }

  private fun postContinuationNotification(context: Context, sessionId: Int, continuation: Intent) {
    if (
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return

    val manager = context.getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(
          UpdaterContract.NOTIFICATION_CHANNEL,
          "Complete LiftLog update",
          NotificationManager.IMPORTANCE_HIGH
        )
      )
    }
    val action = PendingIntent.getActivity(
      context,
      sessionId,
      continuation,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val notification = android.app.Notification.Builder(context, UpdaterContract.NOTIFICATION_CHANNEL)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle("Complete LiftLog update")
      .setContentText("Tap to review Android's installation confirmation")
      .setContentIntent(action)
      .setAutoCancel(true)
      .build()
    manager.notify(UpdaterContract.NOTIFICATION_ID, notification)
  }

  private companion object {
    const val TAG = "LiftlogUpdater"
  }
}

internal object PendingConfirmationRegistry {
  private val intents = mutableMapOf<String, Intent>()

  @Synchronized fun hold(attemptId: String, intent: Intent) {
    intents[attemptId] = intent
  }

  @Synchronized fun take(attemptId: String): Intent? = intents.remove(attemptId)
}

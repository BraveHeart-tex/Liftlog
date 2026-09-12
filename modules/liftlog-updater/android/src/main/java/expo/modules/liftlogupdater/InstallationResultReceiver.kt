package expo.modules.liftlogupdater

import android.Manifest
import android.app.Activity
import android.app.ActivityManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.net.Uri
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

    val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)

    when (status) {
      PackageInstaller.STATUS_PENDING_USER_ACTION -> {
        store.markPendingConfirmation()
        continuationIntent(intent)?.let { continuation ->
          val confirmation = UpdateConfirmationIntent.create(
            context,
            callbackSessionId,
            continuation
          )
          if (!launchWhileForeground(confirmation)) {
            UpdateConfirmationNotification.post(context, confirmation)
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
        val terminal = InstallerStatusMapping.terminal(status)
        if (terminal.stage == UpdateStage.FAILED) {
          appendFailureDiagnostic(
            store,
            intent,
            callbackAttemptId!!,
            status,
            terminal.code
          )
        }
        store.finish(terminal.stage, terminal.code)
      }
    }
    if (store.stage() != UpdateStage.PENDING_CONFIRMATION) {
      UpdateConfirmationNotification.cancel(context, callbackSessionId)
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

  private fun launchWhileForeground(confirmation: PendingIntent): Boolean {
    val process = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(process)
    if (process.importance > ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) return false
    return runCatching {
      confirmation.send()
      true
    }.getOrDefault(false)
  }

  private companion object {
    const val TAG = "LiftlogUpdater"
  }
}

internal object UpdateConfirmationIntent {
  private const val ACTION = "expo.modules.liftlogupdater.CONFIRM_INSTALL"

  fun create(context: Context, sessionId: Int, continuation: Intent): PendingIntent =
    PendingIntent.getActivity(
      context,
      sessionId,
      wrapperIntent(context, sessionId).putExtra(Intent.EXTRA_INTENT, continuation),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

  fun existing(context: Context, sessionId: Int): PendingIntent? =
    PendingIntent.getActivity(
      context,
      sessionId,
      wrapperIntent(context, sessionId),
      PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
    )

  private fun wrapperIntent(context: Context, sessionId: Int): Intent =
    Intent(context, UpdateConfirmationActivity::class.java).apply {
      action = ACTION
      data = Uri.parse("liftlog://update-confirmation/$sessionId")
    }
}

class UpdateConfirmationActivity : Activity() {
  override fun onCreate(savedInstanceState: android.os.Bundle?) {
    super.onCreate(savedInstanceState)
    val continuation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
    } else {
      @Suppress("DEPRECATION") intent.getParcelableExtra(Intent.EXTRA_INTENT)
    }

    try {
      if (continuation != null) {
        startActivity(continuation)
      }
    } catch (error: Throwable) {
      Log.e("LiftlogUpdater", "Failed to launch update confirmation", error)
    } finally {
      finish()
    }
  }
}

internal object UpdateConfirmationNotification {
  fun post(context: Context, confirmation: PendingIntent) {
    if (
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return

    runCatching {
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
      val notification = android.app.Notification.Builder(context, UpdaterContract.NOTIFICATION_CHANNEL)
        .setSmallIcon(context.applicationInfo.icon)
        .setContentTitle("Complete LiftLog update")
        .setContentText("Tap to review Android's installation confirmation")
        .setContentIntent(confirmation)
        .setAutoCancel(true)
        .build()
      manager.notify(UpdaterContract.NOTIFICATION_ID, notification)
    }.onFailure { error ->
      Log.e("LiftlogUpdater", "Failed to post update confirmation notification", error)
    }
  }

  fun resume(activity: Activity, context: Context, sessionId: Int): Boolean {
    val confirmation = UpdateConfirmationIntent.existing(context, sessionId) ?: return false

    return try {
      activity.startIntentSender(confirmation.intentSender, null, 0, 0, 0)
      true
    } catch (_: Throwable) {
      false
    }
  }

  fun cancel(context: Context, sessionId: Int) {
    runCatching {
      context.getSystemService(NotificationManager::class.java)
        .cancel(UpdaterContract.NOTIFICATION_ID)
      if (sessionId >= 0) {
        UpdateConfirmationIntent.existing(context, sessionId)?.cancel()
      }
    }.onFailure { error ->
      Log.e("LiftlogUpdater", "Failed to cancel update confirmation notification", error)
    }
  }
}

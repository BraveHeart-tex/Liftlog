package expo.modules.liftlogupdater

import android.app.Activity
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.os.Bundle
import android.util.Log
import java.util.UUID

class InstallationResultActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    try {
      handleInstallerResult(intent)
    } finally {
      finish()
    }
  }

  private fun handleInstallerResult(callback: Intent) {
    val store = DurableUpdateStore(this)
    val callbackAttemptId = callback.getStringExtra(UpdaterContract.EXTRA_ATTEMPT_ID)
    val callbackSessionId = callback.getIntExtra(UpdaterContract.EXTRA_SESSION_ID, -1)
    val validCallback = UpdateTransitions.acceptsCallback(
      store.attemptId(),
      store.callbackSessionId(),
      callbackAttemptId,
      callbackSessionId
    )
    val status = callback.getIntExtra(
      PackageInstaller.EXTRA_STATUS,
      PackageInstaller.STATUS_FAILURE
    )

    InstallerResultHandler(
      AndroidInstallerResultEffects(
        context = this,
        callback = callback,
        store = store,
        attemptId = callbackAttemptId,
        sessionId = callbackSessionId,
        launchConfirmation = { confirmation ->
          runCatching {
            confirmation.send()
            true
          }.getOrDefault(false)
        },
        relaunch = { relaunchApplication(this) }
      )
    ).handle(validCallback, status, relaunchEligible = true)
  }
}

internal class AndroidInstallerResultEffects(
  private val context: Context,
  private val callback: Intent,
  private val store: DurableUpdateStore,
  private val attemptId: String?,
  private val sessionId: Int,
  private val launchConfirmation: (PendingIntent) -> Boolean,
  private val relaunch: () -> RelaunchOutcome
) : InstallerResultEffects {
  private val continuation: Intent? by lazy { callback.continuationIntent() }
  private var confirmation: PendingIntent? = null

  override fun appendOutcome(resultCode: String) {
    val validAttemptId = attemptId ?: return
    runCatching {
      store.appendDiagnostic(
        InstallerResultOutcomeDiagnosticFactory.create(
          attemptId = validAttemptId,
          nativeStage = store.stage(),
          resultCode = resultCode,
          targetVersionName = store.targetVersionName(),
          targetVersionCode = store.targetVersionCode(),
          diagnosticId = UUID.randomUUID().toString(),
          occurredAtMillis = System.currentTimeMillis()
        )
      )
    }.onFailure { error ->
      Log.e(TAG, "Failed to persist installer result outcome", error)
    }
  }

  override fun markPendingConfirmation() = store.markPendingConfirmation()

  override fun hasConfirmation(): Boolean = continuation != null

  override fun launchConfirmation(): Boolean {
    val continuation = continuation ?: return false
    val pendingIntent = UpdateConfirmationIntent.create(context, sessionId, continuation)
    confirmation = pendingIntent
    return launchConfirmation(pendingIntent)
  }

  override fun preserveConfirmationFallback() {
    confirmation?.let { UpdateConfirmationNotification.post(context, it) }
  }

  override fun failMissingConfirmation() {
    appendFailure("UPDATER_CONFIRMATION_MISSING")
    store.finish(UpdateStage.FAILED, "UPDATER_CONFIRMATION_MISSING")
  }

  override fun reconcileSuccess(): Boolean =
    UpdateReplacementCompletion.reconcile(context, store)

  override fun markCommitted() = store.setStage(UpdateStage.COMMITTED)

  override fun relaunch(): RelaunchOutcome = relaunch()

  override fun finish(status: Int) {
    val terminal = InstallerStatusMapping.terminal(status)
    if (terminal.stage == UpdateStage.FAILED) appendFailure(terminal.code)
    store.finish(terminal.stage, terminal.code)
  }

  override fun cancelConfirmation() {
    UpdateConfirmationNotification.cancel(context, sessionId)
  }

  override fun cleanupTerminal() {
    OwnedUpdateArtifact.delete(context, store)
  }

  private fun appendFailure(resultCode: String) {
    val validAttemptId = attemptId ?: return
    runCatching {
      InstallerDiagnosticFactory.create(
        attemptId = validAttemptId,
        nativeStage = store.stage(),
        targetVersionName = store.targetVersionName(),
        targetVersionCode = store.targetVersionCode(),
        status = callback.getIntExtra(
          PackageInstaller.EXTRA_STATUS,
          PackageInstaller.STATUS_FAILURE
        ),
        statusMessage = callback.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE),
        blockingPackage = callback.getStringExtra(PackageInstaller.EXTRA_OTHER_PACKAGE_NAME),
        storagePath = callback.getStringExtra(PackageInstaller.EXTRA_STORAGE_PATH),
        diagnosticId = UUID.randomUUID().toString(),
        occurredAtMillis = System.currentTimeMillis(),
        resultCode = resultCode
      )?.let(store::appendDiagnostic)
    }.onFailure { error ->
      Log.e(TAG, "Failed to persist sanitized update diagnostic", error)
    }
  }

  private companion object {
    const val TAG = "LiftlogUpdater"
  }
}

private fun relaunchApplication(activity: Activity): RelaunchOutcome {
  val launchIntent = activity.packageManager
    .getLaunchIntentForPackage(activity.packageName)
    ?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
    ?: return RelaunchOutcome.LAUNCHER_UNAVAILABLE

  return runCatching {
    activity.startActivity(launchIntent)
    RelaunchOutcome.LAUNCHED
  }.onFailure { error ->
    Log.e("LiftlogUpdater", "Failed to relaunch LiftLog after update", error)
  }.getOrDefault(RelaunchOutcome.FAILED)
}

private fun Intent.continuationIntent(): Intent? =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
  } else {
    @Suppress("DEPRECATION")
    getParcelableExtra(Intent.EXTRA_INTENT)
  }

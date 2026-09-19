package expo.modules.liftlogupdater

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.util.Log
import java.util.UUID

internal class AndroidInstallerResultEffects(
  private val context: Context,
  private val callback: Intent,
  private val store: DurableUpdateStore,
  private val attemptId: String?,
  private val sessionId: Int,
  private val launchConfirmation: (Intent) -> Boolean
) : InstallerResultEffects {
  private val continuation: Intent? by lazy { callback.continuationIntent() }
  private var confirmation: PendingIntent? = null

  override fun markPendingConfirmation() = store.markPendingConfirmation()

  override fun hasConfirmation(): Boolean {
    val continuation = continuation ?: return false
    confirmation = UpdateConfirmationIntent.create(context, sessionId, continuation)
    return true
  }

  override fun launchConfirmation(): Boolean =
    continuation?.let(launchConfirmation) ?: false

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

private fun Intent.continuationIntent(): Intent? =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
  } else {
    @Suppress("DEPRECATION")
    getParcelableExtra(Intent.EXTRA_INTENT)
  }

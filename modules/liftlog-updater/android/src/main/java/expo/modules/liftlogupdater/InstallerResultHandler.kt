package expo.modules.liftlogupdater

import android.content.pm.PackageInstaller

internal enum class RelaunchOutcome(val resultCode: String) {
  LAUNCHED("UPDATER_RELAUNCH_SUCCEEDED"),
  LAUNCHER_UNAVAILABLE("UPDATER_RELAUNCH_LAUNCHER_UNAVAILABLE"),
  FAILED("UPDATER_RELAUNCH_FAILED")
}

internal interface InstallerResultEffects {
  fun appendOutcome(resultCode: String)
  fun markPendingConfirmation()
  fun hasConfirmation(): Boolean
  fun launchConfirmation(): Boolean
  fun preserveConfirmationFallback()
  fun failMissingConfirmation()
  fun reconcileSuccess(): Boolean
  fun markCommitted()
  fun relaunch(): RelaunchOutcome
  fun finish(status: Int)
  fun cancelConfirmation()
  fun cleanupTerminal()
}

internal class InstallerResultHandler(
  private val effects: InstallerResultEffects
) {
  fun handle(validCallback: Boolean, status: Int, relaunchEligible: Boolean) {
    if (!validCallback) return
    if (relaunchEligible) appendOutcome("UPDATER_RESULT_ACTIVITY_ENTERED")

    when (status) {
      PackageInstaller.STATUS_PENDING_USER_ACTION -> {
        effects.markPendingConfirmation()
        if (!effects.hasConfirmation()) {
          effects.failMissingConfirmation()
          effects.cancelConfirmation()
          effects.cleanupTerminal()
        } else if (!effects.launchConfirmation()) {
          effects.preserveConfirmationFallback()
        }
      }
      PackageInstaller.STATUS_SUCCESS -> {
        if (!effects.reconcileSuccess()) {
          effects.markCommitted()
        } else if (relaunchEligible) {
          appendOutcome("UPDATER_RELAUNCH_ATTEMPTED")
          val outcome = effects.relaunch()
          appendOutcome(outcome.resultCode)
        }
        effects.cancelConfirmation()
      }
      else -> {
        effects.finish(status)
        effects.cancelConfirmation()
        effects.cleanupTerminal()
      }
    }
  }

  private fun appendOutcome(resultCode: String) {
    runCatching { effects.appendOutcome(resultCode) }
  }
}

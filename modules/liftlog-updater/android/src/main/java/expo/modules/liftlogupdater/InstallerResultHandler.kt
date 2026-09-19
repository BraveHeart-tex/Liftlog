package expo.modules.liftlogupdater

import android.content.pm.PackageInstaller

internal interface InstallerResultEffects {
  fun markPendingConfirmation()
  fun hasConfirmation(): Boolean
  fun launchConfirmation(): Boolean
  fun preserveConfirmationFallback()
  fun failMissingConfirmation()
  fun reconcileSuccess(): Boolean
  fun markCommitted()
  fun finish(status: Int)
  fun cancelConfirmation()
  fun cleanupTerminal()
}

internal class InstallerResultHandler(
  private val effects: InstallerResultEffects
) {
  fun handle(validCallback: Boolean, status: Int) {
    if (!validCallback) return

    when (status) {
      PackageInstaller.STATUS_PENDING_USER_ACTION -> {
        effects.markPendingConfirmation()
        if (!effects.hasConfirmation()) {
          effects.failMissingConfirmation()
          effects.cancelConfirmation()
          effects.cleanupTerminal()
        } else {
          effects.preserveConfirmationFallback()
          effects.launchConfirmation()
        }
      }
      PackageInstaller.STATUS_SUCCESS -> {
        if (!effects.reconcileSuccess()) {
          effects.markCommitted()
        } else {
          effects.cancelConfirmation()
        }
      }
      else -> {
        effects.finish(status)
        effects.cancelConfirmation()
        effects.cleanupTerminal()
      }
    }
  }

}

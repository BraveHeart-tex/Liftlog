package expo.modules.liftlogupdater

import android.content.pm.PackageInstaller
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InstallerResultHandlerTest {
  @Test
  fun `pending confirmation launches Android action and preserves fallback when launch fails`() {
    val effects = RecordingInstallerResultEffects(
      confirmationAvailable = true,
      confirmationLaunched = false
    )

    InstallerResultHandler(effects).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_PENDING_USER_ACTION,
      relaunchEligible = true
    )

    assertEquals(UpdateStage.PENDING_CONFIRMATION, effects.stage)
    assertEquals(1, effects.confirmationLaunchCalls)
    assertEquals(1, effects.confirmationFallbackCalls)
    assertFalse(effects.relaunchRequested)
  }

  @Test
  fun `verified success from result activity attempts normal launcher entry`() {
    val effects = RecordingInstallerResultEffects(
      completionProven = true,
      relaunchOutcome = RelaunchOutcome.LAUNCHED
    )

    InstallerResultHandler(effects).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_SUCCESS,
      relaunchEligible = true
    )

    assertTrue(effects.relaunchRequested)
    assertEquals(UpdateStage.SUCCEEDED, effects.stage)
    assertEquals(
      listOf(
        "UPDATER_RESULT_ACTIVITY_ENTERED",
        "UPDATER_RELAUNCH_ATTEMPTED",
        "UPDATER_RELAUNCH_SUCCEEDED"
      ),
      effects.outcomes
    )
  }

  @Test
  fun `unavailable launcher records failure and keeps fallback without blocking success`() {
    val effects = RecordingInstallerResultEffects(
      completionProven = true,
      relaunchOutcome = RelaunchOutcome.LAUNCHER_UNAVAILABLE
    )

    InstallerResultHandler(effects).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_SUCCESS,
      relaunchEligible = true
    )

    assertEquals(UpdateStage.SUCCEEDED, effects.stage)
    assertEquals(
      listOf(
        "UPDATER_RESULT_ACTIVITY_ENTERED",
        "UPDATER_RELAUNCH_ATTEMPTED",
        "UPDATER_RELAUNCH_LAUNCHER_UNAVAILABLE"
      ),
      effects.outcomes
    )
  }

  @Test
  fun `relaunch failure records failure after preserving reconciliation fallback`() {
    val effects = RecordingInstallerResultEffects(
      completionProven = true,
      relaunchOutcome = RelaunchOutcome.FAILED
    )

    InstallerResultHandler(effects).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_SUCCESS,
      relaunchEligible = true
    )

    assertEquals(1, effects.fallbackInteractionCalls)
    assertEquals(
      listOf(
        "UPDATER_RESULT_ACTIVITY_ENTERED",
        "UPDATER_RELAUNCH_ATTEMPTED",
        "UPDATER_RELAUNCH_FAILED"
      ),
      effects.outcomes
    )
  }

  @Test
  fun `unproven success remains committed and never relaunches`() {
    val effects = RecordingInstallerResultEffects(completionProven = false)

    InstallerResultHandler(effects).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_SUCCESS,
      relaunchEligible = true
    )

    assertEquals(UpdateStage.COMMITTED, effects.stage)
    assertFalse(effects.relaunchRequested)
  }

  @Test
  fun `cancellation failure and stale identity never relaunch or display success`() {
    val cancelled = RecordingInstallerResultEffects()
    InstallerResultHandler(cancelled).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_FAILURE_ABORTED,
      relaunchEligible = true
    )
    assertEquals(UpdateStage.CANCELLED, cancelled.stage)
    assertFalse(cancelled.relaunchRequested)
    assertEquals(1, cancelled.cleanupCalls)

    val failed = RecordingInstallerResultEffects()
    InstallerResultHandler(failed).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_FAILURE_INVALID,
      relaunchEligible = true
    )
    assertEquals(UpdateStage.FAILED, failed.stage)
    assertFalse(failed.relaunchRequested)
    assertEquals(1, failed.cleanupCalls)

    val stale = RecordingInstallerResultEffects(completionProven = true)
    InstallerResultHandler(stale).handle(
      validCallback = false,
      status = PackageInstaller.STATUS_SUCCESS,
      relaunchEligible = true
    )
    assertEquals(UpdateStage.COMMITTED, stale.stage)
    assertFalse(stale.relaunchRequested)
    assertTrue(stale.outcomes.isEmpty())
  }

  @Test
  fun `legacy broadcast success preserves fallback but cannot relaunch`() {
    val effects = RecordingInstallerResultEffects(completionProven = true)

    InstallerResultHandler(effects).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_SUCCESS,
      relaunchEligible = false
    )

    assertEquals(UpdateStage.SUCCEEDED, effects.stage)
    assertFalse(effects.relaunchRequested)
    assertEquals(1, effects.fallbackInteractionCalls)
    assertTrue(effects.outcomes.isEmpty())
  }

  @Test
  fun `diagnostic reporting failure cannot block verified relaunch`() {
    val effects = RecordingInstallerResultEffects(
      completionProven = true,
      relaunchOutcome = RelaunchOutcome.LAUNCHED,
      failOutcome = true
    )

    InstallerResultHandler(effects).handle(
      validCallback = true,
      status = PackageInstaller.STATUS_SUCCESS,
      relaunchEligible = true
    )

    assertEquals(UpdateStage.SUCCEEDED, effects.stage)
    assertTrue(effects.relaunchRequested)
  }
}

private class RecordingInstallerResultEffects(
  private val confirmationAvailable: Boolean = false,
  private val confirmationLaunched: Boolean = false,
  private val completionProven: Boolean = false,
  private val relaunchOutcome: RelaunchOutcome = RelaunchOutcome.FAILED,
  private val failOutcome: Boolean = false
) : InstallerResultEffects {
  var stage = UpdateStage.COMMITTED
  var confirmationLaunchCalls = 0
  var confirmationFallbackCalls = 0
  var relaunchRequested = false
  var cleanupCalls = 0
  var fallbackInteractionCalls = 0
  val outcomes = mutableListOf<String>()

  override fun appendOutcome(resultCode: String) {
    if (failOutcome) throw IllegalStateException("diagnostics unavailable")
    outcomes += resultCode
  }

  override fun markPendingConfirmation() {
    stage = UpdateStage.PENDING_CONFIRMATION
  }

  override fun hasConfirmation(): Boolean = confirmationAvailable

  override fun launchConfirmation(): Boolean {
    confirmationLaunchCalls += 1
    return confirmationLaunched
  }

  override fun preserveConfirmationFallback() {
    confirmationFallbackCalls += 1
  }

  override fun failMissingConfirmation() {
    stage = UpdateStage.FAILED
  }

  override fun reconcileSuccess(): Boolean {
    if (completionProven) {
      stage = UpdateStage.SUCCEEDED
      fallbackInteractionCalls += 1
    }
    return completionProven
  }

  override fun markCommitted() {
    stage = UpdateStage.COMMITTED
  }

  override fun relaunch(): RelaunchOutcome {
    relaunchRequested = true
    return relaunchOutcome
  }

  override fun finish(status: Int) {
    stage = InstallerStatusMapping.terminal(status).stage
  }

  override fun cancelConfirmation() = Unit

  override fun cleanupTerminal() {
    cleanupCalls += 1
  }
}

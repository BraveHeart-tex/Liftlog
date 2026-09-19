package expo.modules.liftlogupdater

import android.content.pm.PackageInstaller
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InstallerResultHandlerTest {
  @Test fun `valid pending callback persists pending state`() {
    val effects = RecordingEffects(confirmationAvailable = true)
    handle(effects, PackageInstaller.STATUS_PENDING_USER_ACTION)
    assertEquals(UpdateStage.PENDING_CONFIRMATION, effects.stage)
  }

  @Test fun `available continuation preserves fallback before attempting launch`() {
    val effects = RecordingEffects(confirmationAvailable = true)
    handle(effects, PackageInstaller.STATUS_PENDING_USER_ACTION)
    assertEquals(listOf("pending", "check", "fallback", "launch"), effects.calls)
  }

  @Test fun `foreground launch success does not remove fallback`() {
    val effects = RecordingEffects(confirmationAvailable = true, confirmationLaunched = true)
    handle(effects, PackageInstaller.STATUS_PENDING_USER_ACTION)
    assertEquals(1, effects.fallbackCalls)
    assertEquals(0, effects.cancelCalls)
  }

  @Test fun `foreground launch failure remains pending and recoverable`() {
    val effects = RecordingEffects(confirmationAvailable = true)
    handle(effects, PackageInstaller.STATUS_PENDING_USER_ACTION)
    assertEquals(UpdateStage.PENDING_CONFIRMATION, effects.stage)
    assertEquals(1, effects.fallbackCalls)
    assertEquals(0, effects.cleanupCalls)
  }

  @Test fun `missing continuation fails with cleanup`() {
    val effects = RecordingEffects()
    handle(effects, PackageInstaller.STATUS_PENDING_USER_ACTION)
    assertEquals(UpdateStage.FAILED, effects.stage)
    assertEquals(1, effects.cancelCalls)
    assertEquals(1, effects.cleanupCalls)
    assertFalse(effects.calls.contains("launch"))
  }

  @Test fun `proven success reconciles and cancels confirmation`() {
    val effects = RecordingEffects(completionProven = true)
    handle(effects, PackageInstaller.STATUS_SUCCESS)
    assertEquals(UpdateStage.SUCCEEDED, effects.stage)
    assertEquals(1, effects.cancelCalls)
  }

  @Test fun `unproven success remains committed`() {
    val effects = RecordingEffects().apply { stage = UpdateStage.PENDING_CONFIRMATION }
    handle(effects, PackageInstaller.STATUS_SUCCESS)
    assertEquals(UpdateStage.COMMITTED, effects.stage)
    assertEquals(0, effects.cancelCalls)
  }

  @Test fun `cancellation maps to cancelled and cleans up`() {
    val effects = RecordingEffects()
    handle(effects, PackageInstaller.STATUS_FAILURE_ABORTED)
    assertEquals(UpdateStage.CANCELLED, effects.stage)
    assertEquals(1, effects.cancelCalls)
    assertEquals(1, effects.cleanupCalls)
  }

  @Test fun `installer failures map correctly and clean up`() {
    val effects = RecordingEffects()
    handle(effects, PackageInstaller.STATUS_FAILURE_INVALID)
    assertEquals(UpdateStage.FAILED, effects.stage)
    assertEquals(1, effects.cancelCalls)
    assertEquals(1, effects.cleanupCalls)
  }

  @Test fun `stale attempt or session callback makes no changes`() {
    val effects = RecordingEffects(completionProven = true)
    InstallerResultHandler(effects).handle(false, PackageInstaller.STATUS_SUCCESS)
    assertEquals(UpdateStage.COMMITTED, effects.stage)
    assertTrue(effects.calls.isEmpty())
  }

  @Test fun `diagnostic failure cannot block state transitions`() {
    val effects = RecordingEffects(diagnosticFailure = true)
    handle(effects, PackageInstaller.STATUS_FAILURE_BLOCKED)
    assertEquals(UpdateStage.FAILED, effects.stage)
    assertEquals(1, effects.cleanupCalls)
  }

  private fun handle(effects: RecordingEffects, status: Int) {
    InstallerResultHandler(effects).handle(true, status)
  }
}

private class RecordingEffects(
  private val confirmationAvailable: Boolean = false,
  private val confirmationLaunched: Boolean = false,
  private val completionProven: Boolean = false,
  private val diagnosticFailure: Boolean = false
) : InstallerResultEffects {
  var stage = UpdateStage.COMMITTED
  var fallbackCalls = 0
  var cancelCalls = 0
  var cleanupCalls = 0
  val calls = mutableListOf<String>()

  override fun markPendingConfirmation() { calls += "pending"; stage = UpdateStage.PENDING_CONFIRMATION }
  override fun hasConfirmation(): Boolean { calls += "check"; return confirmationAvailable }
  override fun launchConfirmation(): Boolean { calls += "launch"; return confirmationLaunched }
  override fun preserveConfirmationFallback() { calls += "fallback"; fallbackCalls += 1 }
  override fun failMissingConfirmation() { stage = UpdateStage.FAILED }
  override fun reconcileSuccess(): Boolean {
    calls += "reconcile"
    if (completionProven) stage = UpdateStage.SUCCEEDED
    return completionProven
  }
  override fun markCommitted() { stage = UpdateStage.COMMITTED }
  override fun finish(status: Int) {
    runCatching { if (diagnosticFailure) error("diagnostics unavailable") }
    stage = InstallerStatusMapping.terminal(status).stage
  }
  override fun cancelConfirmation() { cancelCalls += 1 }
  override fun cleanupTerminal() { cleanupCalls += 1 }
}

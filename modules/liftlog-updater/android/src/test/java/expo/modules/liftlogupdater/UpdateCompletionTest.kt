package expo.modules.liftlogupdater

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class UpdateCompletionTest {
  @Test
  fun `package replacement proves success and preserves installed version`() {
    assertEquals(
      PackageReplacementResult.Succeeded(
        UpdateCompletionAcknowledgement("attempt-1", "1.1.1", 12)
      ),
      InstallerResultHandling.packageReplaced(
        stage = UpdateStage.COMMITTED,
        attemptId = "attempt-1",
        targetVersionCode = 11,
        installedVersionName = "1.1.1",
        installedVersionCode = 12
      )
    )
  }

  @Test
  fun `unproven and unrelated replacements never create completion`() {
    assertEquals(
      PackageReplacementResult.Unproven,
      InstallerResultHandling.packageReplaced(
        UpdateStage.COMMITTED,
        "attempt-1",
        11,
        "1.0.9",
        10
      )
    )

    for (stage in listOf(
      UpdateStage.IDLE,
      UpdateStage.STAGED,
      UpdateStage.CANCELLED,
      UpdateStage.FAILED,
      UpdateStage.INTERRUPTED,
      UpdateStage.SUCCEEDED
    )) {
      assertEquals(
        stage.wireValue,
        PackageReplacementResult.Ignored,
        InstallerResultHandling.packageReplaced(stage, "attempt-1", 11, "1.1.0", 11)
      )
    }

    assertEquals(
      PackageReplacementResult.Ignored,
      InstallerResultHandling.packageReplaced(UpdateStage.COMMITTED, null, 11, "1.1.0", 11)
    )
  }

  @Test
  fun `completion acknowledgement encoding round trips installed metadata`() {
    val completion = UpdateCompletionAcknowledgement("attempt-1", "1.1.0", 11)

    assertEquals(completion, UpdateCompletionCodec.decode(UpdateCompletionCodec.encode(completion)))
    assertNull(UpdateCompletionCodec.decode("invalid"))
  }

  @Test
  fun `fallback only posts when permission and launcher entry point exist`() {
    assertEquals(
      CompletionNotificationOutcome.POSTED,
      CompletionNotificationDecision.decide(permissionGranted = true, launcherAvailable = true)
    )
    assertEquals(
      CompletionNotificationOutcome.PERMISSION_UNAVAILABLE,
      CompletionNotificationDecision.decide(permissionGranted = false, launcherAvailable = true)
    )
    assertEquals(
      CompletionNotificationOutcome.LAUNCHER_UNAVAILABLE,
      CompletionNotificationDecision.decide(permissionGranted = true, launcherAvailable = false)
    )
  }

  @Test
  fun `proven completion persists cleans posts and records the fallback outcome`() {
    val effects = RecordingCompletionEffects()
    val handler = UpdateCompletionHandler(effects, { "diagnostic-1" }, { 123L })
    val completion = UpdateCompletionAcknowledgement("attempt-1", "1.1.0", 11)

    assertEquals(true, handler.complete(PackageReplacementResult.Succeeded(completion)))
    assertEquals(completion, effects.persisted)
    assertEquals(1, effects.cleanupCalls)
    assertEquals(1, effects.notificationCalls)
    assertEquals("UPDATER_COMPLETION_NOTIFICATION_POSTED", effects.diagnostic?.resultCode)
    assertEquals(DiagnosticKind.OUTCOME, effects.diagnostic?.kind)
    assertEquals(DiagnosticSource.ANDROID_PACKAGE_REPLACED, effects.diagnostic?.source)
  }

  @Test
  fun `ignored replacement has no effects and reporting failure cannot change success`() {
    val ignoredEffects = RecordingCompletionEffects()
    assertEquals(
      false,
      UpdateCompletionHandler(ignoredEffects, { "diagnostic-1" }, { 123L })
        .complete(PackageReplacementResult.Ignored)
    )
    assertNull(ignoredEffects.persisted)
    assertEquals(0, ignoredEffects.cleanupCalls)

    val reportingFailure = RecordingCompletionEffects(failDiagnostic = true)
    assertEquals(
      true,
      UpdateCompletionHandler(reportingFailure, { "diagnostic-1" }, { 123L })
        .complete(
          PackageReplacementResult.Succeeded(
            UpdateCompletionAcknowledgement("attempt-1", "1.1.0", 11)
          )
        )
    )
    assertEquals(UpdateStage.SUCCEEDED, reportingFailure.stage)
  }
}

private class RecordingCompletionEffects(
  private val failDiagnostic: Boolean = false
) : UpdateCompletionEffects {
  var stage = UpdateStage.COMMITTED
  var persisted: UpdateCompletionAcknowledgement? = null
  var cleanupCalls = 0
  var notificationCalls = 0
  var diagnostic: UpdateDiagnostic? = null

  override fun persist(completion: UpdateCompletionAcknowledgement) {
    persisted = completion
    stage = UpdateStage.SUCCEEDED
  }

  override fun cleanup() {
    cleanupCalls += 1
  }

  override fun postNotification(): CompletionNotificationOutcome {
    notificationCalls += 1
    return CompletionNotificationOutcome.POSTED
  }

  override fun appendDiagnostic(diagnostic: UpdateDiagnostic) {
    if (failDiagnostic) throw IllegalStateException("reporting unavailable")
    this.diagnostic = diagnostic
  }
}

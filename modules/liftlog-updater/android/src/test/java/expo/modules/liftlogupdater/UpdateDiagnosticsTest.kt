package expo.modules.liftlogupdater

import android.content.pm.PackageInstaller
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class UpdateDiagnosticsTest {
  @Test
  fun `installer failure extraction sanitizes optional details before storage`() {
    val diagnostic = InstallerDiagnosticFactory.create(
      attemptId = "attempt-1",
      nativeStage = UpdateStage.COMMITTED,
      targetVersionName = "1.1.0",
      targetVersionCode = 11,
      status = PackageInstaller.STATUS_FAILURE_BLOCKED,
      statusMessage = "  blocked by com.example.secret at file:///data/user/0/app.apk token=abc123  ",
      blockingPackage = "com.android.vending",
      storagePath = "/storage/emulated/0/Download/candidate.apk",
      diagnosticId = "diagnostic-1",
      occurredAtMillis = 1_700_000_000_000
    )

    assertEquals("diagnostic-1", diagnostic?.diagnosticId)
    assertEquals("attempt-1", diagnostic?.attemptId)
    assertEquals(DiagnosticSource.ANDROID_INSTALLER_CALLBACK, diagnostic?.source)
    assertEquals(UpdateStage.COMMITTED, diagnostic?.nativeStage)
    assertEquals("UPDATER_INSTALL_BLOCKED", diagnostic?.resultCode)
    assertEquals(PackageInstaller.STATUS_FAILURE_BLOCKED, diagnostic?.rawStatus)
    assertEquals("blocked by [redacted] at [redacted] [redacted]", diagnostic?.statusMessage)
    assertEquals("com.android.vending", diagnostic?.blockingPackage)
    assertEquals(DiagnosticStorageLocation.EXTERNAL, diagnostic?.storageLocation)
    assertFalse(diagnostic.toString().contains("abc123"))
    assertFalse(diagnostic.toString().contains("/data/user"))
  }

  @Test
  fun `status sanitizer normalizes redacts and bounds retained text`() {
    val sanitized = DiagnosticStatusSanitizer.sanitize(
      "\n bearer very-secret   content://downloads/private " + "z".repeat(640)
    )

    assertEquals(512, sanitized?.length)
    assertFalse(sanitized!!.contains("very-secret"))
    assertFalse(sanitized.contains("content://"))
  }

  @Test
  fun `cancelled callbacks remain quiet`() {
    assertNull(
      InstallerDiagnosticFactory.create(
        attemptId = "attempt-1",
        nativeStage = UpdateStage.COMMITTED,
        targetVersionName = "1.1.0",
        targetVersionCode = 11,
        status = PackageInstaller.STATUS_FAILURE_ABORTED,
        statusMessage = "cancelled",
        blockingPackage = null,
        diagnosticId = "diagnostic-1",
        occurredAtMillis = 1
      )
    )
  }

  @Test
  fun `missing installer confirmation creates a stable failure diagnostic`() {
    val diagnostic = InstallerDiagnosticFactory.create(
      attemptId = "attempt-1",
      nativeStage = UpdateStage.COMMITTED,
      targetVersionName = "1.1.0",
      targetVersionCode = 11,
      status = PackageInstaller.STATUS_PENDING_USER_ACTION,
      statusMessage = null,
      blockingPackage = null,
      diagnosticId = "diagnostic-1",
      occurredAtMillis = 1,
      resultCode = "UPDATER_CONFIRMATION_MISSING"
    )

    assertEquals("UPDATER_CONFIRMATION_MISSING", diagnostic?.resultCode)
    assertEquals(PackageInstaller.STATUS_PENDING_USER_ACTION, diagnostic?.rawStatus)
  }

  @Test
  fun `legacy failed state materializes once and acknowledged records stay materialized`() {
    val persistence = InMemoryDiagnosticPersistence()
    val backlog = UpdateDiagnosticBacklog(persistence)

    assertTrue(backlog.materializeLegacy(legacyDiagnostic("attempt-1")))
    assertFalse(backlog.materializeLegacy(legacyDiagnostic("attempt-1")))
    assertTrue(backlog.acknowledge("attempt-1", "legacy-attempt-1"))
    assertFalse(backlog.materializeLegacy(legacyDiagnostic("attempt-1")))
    assertEquals(0, backlog.snapshotPendingForSubmission().diagnostics.size)
    assertTrue(backlog.materializeLegacy(legacyDiagnostic("attempt-2")))
    assertFalse(backlog.materializeLegacy(legacyDiagnostic("attempt-1")))
  }

  @Test
  fun `existing Android diagnostic prevents duplicate legacy materialization after acknowledgement`() {
    val persistence = InMemoryDiagnosticPersistence()
    val backlog = UpdateDiagnosticBacklog(persistence)
    backlog.append(diagnostic(1))

    assertFalse(backlog.materializeLegacy(legacyDiagnostic("attempt-1")))
    assertEquals(listOf("diagnostic-1"), backlog.snapshotPendingForSubmission().diagnostics.map { it.diagnosticId })
    assertTrue(backlog.acknowledge("attempt-1", "diagnostic-1"))
    assertFalse(backlog.materializeLegacy(legacyDiagnostic("attempt-1")))
    assertEquals(0, backlog.snapshotPendingForSubmission().diagnostics.size)
  }

  @Test
  fun `legacy diagnostics require failed state attempt identity and result code`() {
    assertNull(LegacyFailureDiagnosticFactory.create(UpdateStage.CANCELLED, "attempt-1", "cancelled", null, -1, 1))
    assertNull(LegacyFailureDiagnosticFactory.create(UpdateStage.INTERRUPTED, "attempt-1", "interrupted", null, -1, 1))
    assertNull(LegacyFailureDiagnosticFactory.create(UpdateStage.SUCCEEDED, "attempt-1", "installed", null, -1, 1))
    assertNull(LegacyFailureDiagnosticFactory.create(UpdateStage.FAILED, null, "UPDATER_INSTALL_FAILED", null, -1, 1))
    assertNull(LegacyFailureDiagnosticFactory.create(UpdateStage.FAILED, "attempt-1", null, null, -1, 1))
  }

  @Test
  fun `backlog is durable FIFO capped and rejects stale acknowledgement`() {
    val persistence = InMemoryDiagnosticPersistence()
    val firstStore = UpdateDiagnosticBacklog(persistence)

    (1..6).forEach { index -> firstStore.append(diagnostic(index)) }

    val restored = UpdateDiagnosticBacklog(persistence)
    val pending = restored.snapshotPendingForSubmission()
    assertEquals(listOf("diagnostic-2", "diagnostic-3", "diagnostic-4", "diagnostic-5", "diagnostic-6"), pending.diagnostics.map { it.diagnosticId })
    assertEquals(1, pending.droppedDiagnosticCount)
    assertFalse(restored.acknowledge("attempt-2", "diagnostic-stale"))
    assertEquals(5, restored.snapshotPendingForSubmission().diagnostics.size)
    assertTrue(restored.acknowledge("attempt-2", "diagnostic-2"))
    assertEquals(listOf("diagnostic-3", "diagnostic-4", "diagnostic-5", "diagnostic-6"), restored.snapshotPendingForSubmission().diagnostics.map { it.diagnosticId })
    assertEquals(0, restored.snapshotPendingForSubmission().droppedDiagnosticCount)
  }

  @Test
  fun `diagnostic persistence encoding round trips the sanitized record`() {
    val expected = diagnostic(1).copy(
      statusMessage = "safe OEM detail",
      blockingPackage = "com.android.vending",
      storageLocation = DiagnosticStorageLocation.INTERNAL
    )

    assertEquals(expected, UpdateDiagnosticCodec.decode(UpdateDiagnosticCodec.encode(expected)))
  }

  private fun diagnostic(index: Int) = UpdateFailureDiagnostic(
    diagnosticId = "diagnostic-$index",
    attemptId = "attempt-$index",
    occurredAt = index.toLong(),
    source = DiagnosticSource.ANDROID_INSTALLER_CALLBACK,
    nativeStage = UpdateStage.COMMITTED,
    resultCode = "UPDATER_INSTALL_FAILED",
    targetVersionName = "1.1.$index",
    targetVersionCode = index.toLong(),
    rawStatus = index,
    statusMessage = null,
    blockingPackage = null,
    storageLocation = null
  )

  private fun legacyDiagnostic(attemptId: String) = LegacyFailureDiagnosticFactory.create(
    stage = UpdateStage.FAILED,
    attemptId = attemptId,
    resultCode = "UPDATER_SESSION_MISSING",
    targetVersionName = "1.1.0",
    targetVersionCode = 11,
    occurredAtMillis = 1
  )!!
}

private class InMemoryDiagnosticPersistence : DiagnosticPersistence {
  private var state = DiagnosticBacklogState()
  private val legacyAttemptIds = mutableSetOf<String>()

  override fun load(): DiagnosticBacklogState = state

  override fun save(state: DiagnosticBacklogState) {
    this.state = state
  }

  override fun materializeLegacy(diagnostic: UpdateFailureDiagnostic): Boolean {
    if (diagnostic.attemptId in legacyAttemptIds) return false
    val exists = state.diagnostics.any { it.attemptId == diagnostic.attemptId }
    if (!exists) state = UpdateDiagnosticBacklog.appending(state, diagnostic)
    legacyAttemptIds.add(diagnostic.attemptId)
    return !exists
  }
}

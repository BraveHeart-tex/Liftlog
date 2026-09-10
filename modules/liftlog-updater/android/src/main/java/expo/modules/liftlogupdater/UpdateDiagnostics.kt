package expo.modules.liftlogupdater

import android.content.SharedPreferences
import java.nio.charset.StandardCharsets
import java.util.Base64

internal enum class DiagnosticSource(val wireValue: String) {
  ANDROID_INSTALLER_CALLBACK("android_installer_callback");

  companion object {
    fun fromWire(value: String): DiagnosticSource? = entries.firstOrNull { it.wireValue == value }
  }
}

internal enum class DiagnosticStorageLocation(val wireValue: String) {
  INTERNAL("internal"),
  EXTERNAL("external"),
  OTHER("other");

  companion object {
    fun fromWire(value: String): DiagnosticStorageLocation? = entries.firstOrNull { it.wireValue == value }
  }
}

internal data class UpdateFailureDiagnostic(
  val diagnosticId: String,
  val attemptId: String,
  val occurredAt: Long,
  val source: DiagnosticSource,
  val nativeStage: UpdateStage,
  val resultCode: String,
  val targetVersionName: String?,
  val targetVersionCode: Long?,
  val rawStatus: Int?,
  val statusMessage: String?,
  val blockingPackage: String?,
  val storageLocation: DiagnosticStorageLocation?
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "diagnosticId" to diagnosticId,
    "attemptId" to attemptId,
    "occurredAt" to occurredAt,
    "source" to source.wireValue,
    "nativeStage" to nativeStage.wireValue,
    "resultCode" to resultCode,
    "targetVersionName" to targetVersionName,
    "targetVersionCode" to targetVersionCode,
    "rawStatus" to rawStatus,
    "statusMessage" to statusMessage,
    "blockingPackage" to blockingPackage,
    "storageLocation" to storageLocation?.wireValue
  )
}

internal object DiagnosticStatusSanitizer {
  private val sensitiveValue = Regex(
    "(?i)\\b(?:bearer\\s+\\S+|(?:access[_-]?token|refresh[_-]?token|token|api[_-]?key|password|passwd|credential|secret|authorization)\\s*[:=]\\s*\\S+)"
  )
  private val uri = Regex("(?i)\\b[a-z][a-z0-9+.-]*(?:://|:)\\S+")
  private val absolutePath = Regex("(?<![\\w])/(?:[^\\s/]+/)*[^\\s]+")
  private val longHash = Regex("(?i)\\b(?:[0-9a-f]{32,}|(?:[0-9a-f]{2}:){15,}[0-9a-f]{2})\\b")
  private val packageIdentifier = Regex("\\b[A-Za-z][A-Za-z0-9_]*(?:\\.[A-Za-z][A-Za-z0-9_]*)+\\b")
  private val whitespace = Regex("\\s+")

  fun sanitize(value: String?): String? {
    if (value.isNullOrBlank()) return null
    val sanitized = value
      .replace(uri, "[redacted]")
      .replace(absolutePath, "[redacted]")
      .replace(longHash, "[redacted]")
      .replace(sensitiveValue, "[redacted]")
      .replace(packageIdentifier, "[redacted]")
      .replace(whitespace, " ")
      .trim()

    return sanitized.take(512).ifBlank { null }
  }

  fun structuredPackage(value: String?): String? = value
    ?.takeIf { it.length <= 255 && packageIdentifier.matches(it) }

  fun storageLocation(value: String?): DiagnosticStorageLocation? = when {
    value == null -> null
    value.startsWith("/data/") -> DiagnosticStorageLocation.INTERNAL
    value.startsWith("/storage/") || value.startsWith("/sdcard/") -> DiagnosticStorageLocation.EXTERNAL
    else -> DiagnosticStorageLocation.OTHER
  }
}

internal object InstallerDiagnosticFactory {
  fun create(
    attemptId: String,
    nativeStage: UpdateStage,
    targetVersionName: String?,
    targetVersionCode: Long,
    status: Int,
    statusMessage: String?,
    blockingPackage: String?,
    storagePath: String? = null,
    diagnosticId: String,
    occurredAtMillis: Long,
    resultCode: String? = null
  ): UpdateFailureDiagnostic? {
    val terminal = InstallerStatusMapping.terminal(status)
    if (terminal.stage != UpdateStage.FAILED) return null

    return UpdateFailureDiagnostic(
      diagnosticId = diagnosticId,
      attemptId = attemptId,
      occurredAt = occurredAtMillis,
      source = DiagnosticSource.ANDROID_INSTALLER_CALLBACK,
      nativeStage = nativeStage,
      resultCode = resultCode ?: terminal.code,
      targetVersionName = targetVersionName,
      targetVersionCode = targetVersionCode.takeIf { it >= 0 },
      rawStatus = status,
      statusMessage = DiagnosticStatusSanitizer.sanitize(statusMessage),
      blockingPackage = DiagnosticStatusSanitizer.structuredPackage(blockingPackage),
      storageLocation = DiagnosticStatusSanitizer.storageLocation(storagePath)
    )
  }
}

internal data class PendingUpdateDiagnostics(
  val diagnostics: List<UpdateFailureDiagnostic>,
  val droppedDiagnosticCount: Long
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "diagnostics" to diagnostics.map(UpdateFailureDiagnostic::toMap),
    "droppedDiagnosticCount" to droppedDiagnosticCount
  )
}

internal data class DiagnosticBacklogState(
  val diagnostics: List<UpdateFailureDiagnostic> = emptyList(),
  val droppedDiagnosticCount: Long = 0,
  val exposedDiagnosticId: String? = null,
  val exposedDroppedDiagnosticCount: Long = 0
)

internal interface DiagnosticPersistence {
  fun load(): DiagnosticBacklogState
  fun save(state: DiagnosticBacklogState)
}

internal class UpdateDiagnosticBacklog(private val persistence: DiagnosticPersistence) {
  fun append(diagnostic: UpdateFailureDiagnostic) = synchronized(lock) {
    val current = persistence.load()
    val overflow = current.diagnostics.size >= MAX_DIAGNOSTICS
    val retained = if (overflow) current.diagnostics.drop(1) else current.diagnostics
    val droppedExposed = overflow && current.diagnostics.firstOrNull()?.diagnosticId == current.exposedDiagnosticId
    persistence.save(
      current.copy(
        diagnostics = retained + diagnostic,
        droppedDiagnosticCount = current.droppedDiagnosticCount + if (overflow) 1 else 0,
        exposedDiagnosticId = if (droppedExposed) null else current.exposedDiagnosticId,
        exposedDroppedDiagnosticCount = if (droppedExposed) 0 else current.exposedDroppedDiagnosticCount
      )
    )
  }

  fun snapshotPendingForSubmission(): PendingUpdateDiagnostics = synchronized(lock) {
    val current = persistence.load()
    val oldest = current.diagnostics.firstOrNull()
    if (oldest != null) {
      persistence.save(
        current.copy(
          exposedDiagnosticId = oldest.diagnosticId,
          exposedDroppedDiagnosticCount = current.droppedDiagnosticCount
        )
      )
    }
    PendingUpdateDiagnostics(current.diagnostics, current.droppedDiagnosticCount)
  }

  fun acknowledge(attemptId: String, diagnosticId: String): Boolean = synchronized(lock) {
    val current = persistence.load()
    val index = current.diagnostics.indexOfFirst {
      it.attemptId == attemptId && it.diagnosticId == diagnosticId
    }
    if (index < 0) return@synchronized false
    val clearsExposedCount = current.exposedDiagnosticId == diagnosticId
    persistence.save(
      current.copy(
        diagnostics = current.diagnostics.filterIndexed { recordIndex, _ -> recordIndex != index },
        droppedDiagnosticCount = if (clearsExposedCount) {
          (current.droppedDiagnosticCount - current.exposedDroppedDiagnosticCount).coerceAtLeast(0)
        } else {
          current.droppedDiagnosticCount
        },
        exposedDiagnosticId = if (clearsExposedCount) null else current.exposedDiagnosticId,
        exposedDroppedDiagnosticCount = if (clearsExposedCount) 0 else current.exposedDroppedDiagnosticCount
      )
    )
    true
  }

  companion object {
    const val MAX_DIAGNOSTICS = 5
    private val lock = Any()
  }
}

internal class SharedPreferencesDiagnosticPersistence(
  private val preferences: SharedPreferences
) : DiagnosticPersistence {
  override fun load(): DiagnosticBacklogState = DiagnosticBacklogState(
    diagnostics = preferences.getString(UpdaterContract.DIAGNOSTICS, null)
      ?.lineSequence()
      ?.mapNotNull(UpdateDiagnosticCodec::decode)
      ?.toList()
      .orEmpty(),
    droppedDiagnosticCount = preferences.getLong(UpdaterContract.DROPPED_DIAGNOSTIC_COUNT, 0),
    exposedDiagnosticId = preferences.getString(UpdaterContract.EXPOSED_DIAGNOSTIC_ID, null),
    exposedDroppedDiagnosticCount = preferences.getLong(UpdaterContract.EXPOSED_DROPPED_DIAGNOSTIC_COUNT, 0)
  )

  override fun save(state: DiagnosticBacklogState) {
    val saved = preferences.edit()
      .putString(UpdaterContract.DIAGNOSTICS, state.diagnostics.joinToString("\n", transform = UpdateDiagnosticCodec::encode))
      .putLong(UpdaterContract.DROPPED_DIAGNOSTIC_COUNT, state.droppedDiagnosticCount)
      .putString(UpdaterContract.EXPOSED_DIAGNOSTIC_ID, state.exposedDiagnosticId)
      .putLong(UpdaterContract.EXPOSED_DROPPED_DIAGNOSTIC_COUNT, state.exposedDroppedDiagnosticCount)
      .commit()
    if (!saved) throw UpdaterException("UPDATER_STATE_WRITE_FAILED", "Could not persist update diagnostics")
  }
}

internal object UpdateDiagnosticCodec {
  private val encoder = Base64.getUrlEncoder().withoutPadding()
  private val decoder = Base64.getUrlDecoder()

  fun encode(diagnostic: UpdateFailureDiagnostic): String = listOf(
    diagnostic.diagnosticId,
    diagnostic.attemptId,
    diagnostic.occurredAt.toString(),
    diagnostic.source.wireValue,
    diagnostic.nativeStage.wireValue,
    diagnostic.resultCode,
    diagnostic.targetVersionName,
    diagnostic.targetVersionCode?.toString(),
    diagnostic.rawStatus?.toString(),
    diagnostic.statusMessage,
    diagnostic.blockingPackage,
    diagnostic.storageLocation?.wireValue
  ).joinToString("|") { value -> value?.let(::encodeString).orEmpty() }

  fun decode(value: String): UpdateFailureDiagnostic? = runCatching {
    val fields = value.split('|')
    if (fields.size != 12) return null
    UpdateFailureDiagnostic(
      diagnosticId = decodeString(fields[0]),
      attemptId = decodeString(fields[1]),
      occurredAt = decodeString(fields[2]).toLong(),
      source = DiagnosticSource.fromWire(decodeString(fields[3])) ?: return null,
      nativeStage = UpdateStage.entries.firstOrNull { it.wireValue == decodeString(fields[4]) } ?: return null,
      resultCode = decodeString(fields[5]),
      targetVersionName = fields[6].decodeNullable(),
      targetVersionCode = fields[7].decodeNullable()?.toLong(),
      rawStatus = fields[8].decodeNullable()?.toInt(),
      statusMessage = fields[9].decodeNullable(),
      blockingPackage = fields[10].decodeNullable(),
      storageLocation = fields[11].decodeNullable()?.let(DiagnosticStorageLocation::fromWire)
    )
  }.getOrNull()

  private fun encodeString(value: String): String =
    encoder.encodeToString(value.toByteArray(StandardCharsets.UTF_8))

  private fun decodeString(value: String): String =
    String(decoder.decode(value), StandardCharsets.UTF_8)

  private fun String.decodeNullable(): String? = takeIf(String::isNotEmpty)?.let(::decodeString)
}

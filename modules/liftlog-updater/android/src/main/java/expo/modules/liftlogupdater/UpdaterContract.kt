package expo.modules.liftlogupdater

import android.content.pm.PackageInstaller

internal object UpdaterContract {
  const val PREFERENCES = "liftlog_updater_v1"
  const val CACHE_DIRECTORY = "liftlog-updater"
  const val APK_FILE = "candidate.apk"
  const val NOTIFICATION_CHANNEL = "liftlog_update_confirmation"
  const val NOTIFICATION_ID = 8402

  const val EXTRA_ATTEMPT_ID = "liftlog.attempt_id"
  const val EXTRA_SESSION_ID = "liftlog.session_id"

  const val ATTEMPT_ID = "attempt_id"
  const val STAGE = "stage"
  const val TARGET_VERSION_NAME = "target_version_name"
  const val TARGET_VERSION_CODE = "target_version_code"
  const val EXPECTED_SIZE = "expected_size"
  const val EXPECTED_HASH = "expected_hash"
  const val FILE_PATH = "file_path"
  const val SESSION_ID = "session_id"
  const val PENDING_CONFIRMATION = "pending_confirmation"
  const val UPDATE_EXCLUDED = "update_excluded"
  const val RESULT_CODE = "result_code"
  const val COMMITTED_AT = "committed_at"
}

internal enum class UpdateStage(val wireValue: String) {
  IDLE("idle"),
  DOWNLOADING("downloading"),
  VERIFYING("verifying"),
  STAGED("staged"),
  COMMITTED("committed"),
  PENDING_CONFIRMATION("pending_confirmation"),
  SUCCEEDED("succeeded"),
  CANCELLED("cancelled"),
  FAILED("failed"),
  INTERRUPTED("interrupted");

  val isTerminal: Boolean
    get() = this == SUCCEEDED || this == CANCELLED || this == FAILED || this == INTERRUPTED

  companion object {
    fun fromWire(value: String?): UpdateStage = entries.firstOrNull { it.wireValue == value } ?: IDLE
  }
}

internal object UpdateTransitions {
  fun acceptsCallback(
    storedAttemptId: String?,
    storedSessionId: Int,
    callbackAttemptId: String?,
    callbackSessionId: Int
  ): Boolean =
    storedAttemptId != null &&
      storedAttemptId == callbackAttemptId &&
      storedSessionId >= 0 &&
      storedSessionId == callbackSessionId

  fun reconciledStage(
    current: UpdateStage,
    installedVersionCode: Long,
    targetVersionCode: Long,
    sessionExists: Boolean
  ): UpdateStage {
    if (targetVersionCode > 0 && installedVersionCode >= targetVersionCode) return UpdateStage.SUCCEEDED
    if (current == UpdateStage.COMMITTED || current == UpdateStage.PENDING_CONFIRMATION) {
      return if (sessionExists) current else UpdateStage.FAILED
    }
    if (!current.isTerminal && current != UpdateStage.IDLE) return UpdateStage.INTERRUPTED
    return current
  }
}

internal data class InstallerTerminalResult(val stage: UpdateStage, val code: String)

internal object InstallerStatusMapping {
  fun terminal(status: Int): InstallerTerminalResult = when (status) {
    PackageInstaller.STATUS_FAILURE_ABORTED -> InstallerTerminalResult(UpdateStage.CANCELLED, "UPDATER_INSTALL_CANCELLED")
    PackageInstaller.STATUS_FAILURE_STORAGE -> InstallerTerminalResult(UpdateStage.FAILED, "UPDATER_STORAGE_FAILURE")
    PackageInstaller.STATUS_FAILURE_INCOMPATIBLE -> InstallerTerminalResult(UpdateStage.FAILED, "UPDATER_INCOMPATIBLE_APK")
    PackageInstaller.STATUS_FAILURE_BLOCKED -> InstallerTerminalResult(UpdateStage.FAILED, "UPDATER_INSTALL_BLOCKED")
    PackageInstaller.STATUS_FAILURE_CONFLICT -> InstallerTerminalResult(UpdateStage.FAILED, "UPDATER_INSTALL_CONFLICT")
    PackageInstaller.STATUS_FAILURE_INVALID -> InstallerTerminalResult(UpdateStage.FAILED, "UPDATER_INVALID_APK")
    else -> InstallerTerminalResult(UpdateStage.FAILED, "UPDATER_INSTALL_FAILED")
  }
}

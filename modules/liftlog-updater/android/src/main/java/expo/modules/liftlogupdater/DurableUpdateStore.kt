package expo.modules.liftlogupdater

import android.content.Context
import android.content.SharedPreferences

internal class DurableUpdateStore(context: Context) {
  private val preferences: SharedPreferences =
    context.getSharedPreferences(UpdaterContract.PREFERENCES, Context.MODE_PRIVATE)

  fun attemptId(): String? = preferences.getString(UpdaterContract.ATTEMPT_ID, null)
  fun stage(): UpdateStage = UpdateStage.fromWire(preferences.getString(UpdaterContract.STAGE, null))
  fun targetVersionCode(): Long = preferences.getLong(UpdaterContract.TARGET_VERSION_CODE, -1)
  fun targetVersionName(): String? = preferences.getString(UpdaterContract.TARGET_VERSION_NAME, null)
  fun expectedSize(): Long = preferences.getLong(UpdaterContract.EXPECTED_SIZE, -1)
  fun expectedHash(): String? = preferences.getString(UpdaterContract.EXPECTED_HASH, null)
  fun sessionId(): Int = preferences.getInt(UpdaterContract.SESSION_ID, -1)
  fun filePath(): String? = preferences.getString(UpdaterContract.FILE_PATH, null)

  fun begin(
    attemptId: String,
    versionName: String,
    versionCode: Long,
    sizeBytes: Long,
    sha256: String,
    filePath: String
  ) {
    preferences.edit().clear()
      .putString(UpdaterContract.ATTEMPT_ID, attemptId)
      .putString(UpdaterContract.STAGE, UpdateStage.DOWNLOADING.wireValue)
      .putString(UpdaterContract.TARGET_VERSION_NAME, versionName)
      .putLong(UpdaterContract.TARGET_VERSION_CODE, versionCode)
      .putLong(UpdaterContract.EXPECTED_SIZE, sizeBytes)
      .putString(UpdaterContract.EXPECTED_HASH, sha256)
      .putString(UpdaterContract.FILE_PATH, filePath)
      .putBoolean(UpdaterContract.UPDATE_EXCLUDED, true)
      .apply()
  }

  fun markVerifying() = setStage(UpdateStage.VERIFYING)

  fun markStaged(sessionId: Int) {
    preferences.edit()
      .putInt(UpdaterContract.SESSION_ID, sessionId)
      .putString(UpdaterContract.STAGE, UpdateStage.STAGED.wireValue)
      .apply()
  }

  fun markCommitted() {
    preferences.edit()
      .putString(UpdaterContract.STAGE, UpdateStage.COMMITTED.wireValue)
      .putLong(UpdaterContract.COMMITTED_AT, System.currentTimeMillis())
      .apply()
  }

  fun markPendingConfirmation() {
    preferences.edit()
      .putString(UpdaterContract.STAGE, UpdateStage.PENDING_CONFIRMATION.wireValue)
      .putBoolean(UpdaterContract.PENDING_CONFIRMATION, true)
      .apply()
  }

  fun finish(stage: UpdateStage, resultCode: String?) {
    require(stage.isTerminal)
    preferences.edit()
      .putString(UpdaterContract.STAGE, stage.wireValue)
      .putString(UpdaterContract.RESULT_CODE, resultCode)
      .putBoolean(UpdaterContract.PENDING_CONFIRMATION, false)
      .putBoolean(UpdaterContract.UPDATE_EXCLUDED, false)
      .remove(UpdaterContract.SESSION_ID)
      .apply()
  }

  fun setStage(stage: UpdateStage) {
    preferences.edit().putString(UpdaterContract.STAGE, stage.wireValue).apply()
  }

  fun state(): Map<String, Any?> = mapOf(
    "attemptId" to attemptId(),
    "stage" to stage().wireValue,
    "targetVersionName" to targetVersionName(),
    "targetVersionCode" to targetVersionCode().takeIf { it >= 0 },
    "fileUri" to filePath()?.let { "file://$it" },
    "sessionId" to sessionId().takeIf { it >= 0 },
    "pendingConfirmation" to preferences.getBoolean(UpdaterContract.PENDING_CONFIRMATION, false),
    "updateExcluded" to preferences.getBoolean(UpdaterContract.UPDATE_EXCLUDED, false),
    "resultCode" to preferences.getString(UpdaterContract.RESULT_CODE, null)
  )
}

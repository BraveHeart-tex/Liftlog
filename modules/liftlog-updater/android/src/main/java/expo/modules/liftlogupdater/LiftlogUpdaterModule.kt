package expo.modules.liftlogupdater

import android.app.Activity
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream
import java.lang.ref.WeakReference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private class UpdaterException(code: String, message: String) : CodedException(code, message, null)

class LiftlogUpdaterModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw UpdaterException("context_lost", "React context is unavailable")

  override fun definition() = ModuleDefinition {
    val getInstalledBuildInfo: suspend () -> Map<String, Any?> = {
      installedBuildInfo(context)
    }
    val installVerifiedApkCoroutine: suspend () -> Map<String, Any?> = {
      installVerifiedApk()
    }
    val cleanupCoroutine: suspend () -> Unit? = {
      cleanup()
    }

    Name("LiftlogUpdater")
    Events("onInstallationStatusChanged")

    AsyncFunction("getInstalledBuildInfoAsync") Coroutine getInstalledBuildInfo

    AsyncFunction("getInstallPermissionStatusAsync") {
      val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
      mapOf(
        "canRequestPackageInstalls" to (!supported || context.packageManager.canRequestPackageInstalls()),
        "settingsSupported" to supported
      )
    }

    Function("openInstallPermissionSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startActivity(
          Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
            data = Uri.parse("package:${context.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        )
      }
    }

    AsyncFunction("verifyApkAsync") Coroutine { request: Map<String, Any?> ->
      verifyApk(request)
    }

    AsyncFunction("installVerifiedApkAsync") Coroutine installVerifiedApkCoroutine

    AsyncFunction("getInstallationStatusAsync") {
      reconcileStatus()
    }

    AsyncFunction("cancelInstallationAsync") {
      val sessionId = preferences.getInt(SESSION_ID, -1)
      if (sessionId >= 0) installer.abandonSession(sessionId)
      preferences.getString(VERIFIED_FILE, null)?.let { File(it).delete() }
      preferences.edit()
        .putString(STATE, "cancelled")
        .putString(ERROR_CODE, "installation_cancelled")
        .remove(SESSION_ID)
        .remove(INTENDED_VERSION_CODE)
        .remove(VERIFIED_FILE)
        .remove(VERIFIED_HASH)
        .remove(VERIFIED_VERSION_CODE)
        .apply()
      status().also { sendEvent("onInstallationStatusChanged", it) }
    }

    AsyncFunction("cleanupAsync") Coroutine cleanupCoroutine

    OnCreate {
      instance = WeakReference(this@LiftlogUpdaterModule)
      reconcileStatus()
      appContext.backgroundCoroutineScope.launch { cleanup() }
    }
  }

  private val preferences get() = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
  private val installer get() = context.packageManager.packageInstaller
  private val updaterDirectory get() = File(context.cacheDir, CACHE_DIRECTORY).canonicalFile

  private suspend fun verifyApk(request: Map<String, Any?>): Map<String, Any?> = withContext(Dispatchers.IO) {
    val fileUri = request.string("fileUri")
    val expectedHash = request.string("expectedSha256").lowercase()
    val expectedPackage = request.string("expectedPackageName")
    val expectedVersion = request.long("expectedVersionCode")
    val file = ownedFile(fileUri)
    val hash = ApkVerificationHelper.sha256(file)
    if (hash != expectedHash) throw UpdaterException("verification_failed", "APK checksum does not match")

    val packageInfo = context.packageManager.getPackageArchiveInfo(
      file.absolutePath,
      PackageManager.GET_SIGNING_CERTIFICATES or PackageManager.GET_META_DATA
    ) ?: throw UpdaterException("incompatible_apk", "APK manifest could not be read")
    val signingCertificate = certificateSha256(packageInfo)
    val installed = installedBuildInfo(context)
    val actualVersion = packageInfo.longVersionCode
    if (packageInfo.packageName != expectedPackage || packageInfo.packageName != context.packageName) {
      throw UpdaterException("incompatible_apk", "APK package name does not match this app")
    }
    if (actualVersion != expectedVersion || actualVersion <= installed["versionCode"] as Long) {
      throw UpdaterException("incompatible_apk", "APK version is not newer than the installed version")
    }
    if (signingCertificate != installed["certificateSha256"]) {
      throw UpdaterException("verification_failed", "APK signing certificate does not match")
    }

    preferences.edit()
      .putString(VERIFIED_FILE, file.canonicalPath)
      .putString(VERIFIED_HASH, hash)
      .putLong(VERIFIED_VERSION_CODE, actualVersion)
      .apply()
    mapOf(
      "fileUri" to fileUri,
      "sha256" to hash,
      "packageName" to packageInfo.packageName,
      "versionName" to (packageInfo.versionName ?: ""),
      "versionCode" to actualVersion,
      "certificateSha256" to signingCertificate
    )
  }

  private suspend fun installVerifiedApk(): Map<String, Any?> = withContext(Dispatchers.IO) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
      throw UpdaterException("permission_denied", "Install permission is not granted")
    }
    val file = preferences.getString(VERIFIED_FILE, null)?.let(::File)
      ?: throw UpdaterException("verification_failed", "No verified APK is ready")
    val expectedHash = preferences.getString(VERIFIED_HASH, null)
      ?: throw UpdaterException("verification_failed", "Verified APK checksum is missing")
    val versionCode = preferences.getLong(VERIFIED_VERSION_CODE, -1L)
    val installedVersionCode = (installedBuildInfo(context)["versionCode"] as? Long) ?: -1L
    if (versionCode <= installedVersionCode) {
      throw UpdaterException("incompatible_apk", "APK version is no longer newer than the installed version")
    }
    if (!file.exists() || !isOwnedFile(file) || ApkVerificationHelper.sha256(file) != expectedHash) {
      throw UpdaterException("verification_failed", "Verified APK changed or is no longer available")
    }

    val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
    if (Build.VERSION.SDK_INT >= 31) params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
    val sessionId = installer.createSession(params)
    val session = try {
      installer.openSession(sessionId)
    } catch (error: Throwable) {
      runCatching { installer.abandonSession(sessionId) }
      throw UpdaterException("storage_failure", error.message ?: "Could not open installer session")
    }
    try {
      session.openWrite("base.apk", 0, file.length()).use { output ->
        FileInputStream(file).use { input -> input.copyTo(output) }
        output.flush()
        session.fsync(output)
      }
    } catch (error: Throwable) {
      session.abandon()
      throw UpdaterException("storage_failure", error.message ?: "Could not stage APK")
    }

    preferences.edit()
      .putInt(SESSION_ID, sessionId)
      .putLong(INTENDED_VERSION_CODE, versionCode)
      .putString(STATE, "requested")
      .apply()
    try {
      session.commit(callbackIntent().intentSender)
    } catch (error: Throwable) {
      runCatching { session.abandon() }
      preferences.edit()
        .putString(STATE, "failed")
        .putString(ERROR_CODE, "installation_failure")
        .putString(ERROR_MESSAGE, error.message ?: "Could not commit installer session")
        .remove(SESSION_ID)
        .remove(INTENDED_VERSION_CODE)
        .apply()
      throw UpdaterException("installation_failure", error.message ?: "Could not commit installer session")
    } finally {
      session.close()
    }
    status().also { sendEvent("onInstallationStatusChanged", it) }
  }

  private fun callbackIntent(): PendingIntent {
    val intent = Intent(context, InstallationResultReceiver::class.java)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    return PendingIntent.getBroadcast(context, CALLBACK_REQUEST_CODE, intent, flags)
  }

  private fun reconcileStatus(): Map<String, Any?> {
    val sessionId = preferences.getInt(SESSION_ID, -1)
    if (sessionId >= 0) {
      val sessionInfo = installer.getSessionInfo(sessionId)
      if (sessionInfo == null && preferences.getString(STATE, "idle") == "requested") {
        preferences.edit().putString(STATE, "failed").putString(ERROR_CODE, "installation_failure").putString(ERROR_MESSAGE, "Installer session disappeared").apply()
      }
    }
    val pendingAction = preferences.getString(PENDING_ACTION, null)
    val activity = appContext.currentActivity
    if (pendingAction != null && activity != null && !activity.isFinishing) {
      preferences.edit().remove(PENDING_ACTION).apply()
      runCatching { activity.startActivity(Intent.parseUri(pendingAction, Intent.URI_INTENT_SCHEME)) }
    }
    return status()
  }

  private suspend fun cleanup() = withContext(Dispatchers.IO) {
    updaterDirectory.listFiles()?.forEach { file ->
      if (file.canonicalFile != preferences.getString(VERIFIED_FILE, null)?.let(::File)?.canonicalFile) file.delete()
    }
  }

  private fun ownedFile(uri: String): File {
    val path = Uri.parse(uri).path ?: throw UpdaterException("storage_failure", "APK URI has no path")
    val file = File(path).canonicalFile
    if (!isOwnedFile(file) || !file.isFile) throw UpdaterException("storage_failure", "APK is outside updater cache")
    return file
  }

  private fun isOwnedFile(file: File): Boolean = file.canonicalPath.startsWith(updaterDirectory.canonicalPath + File.separator)

  private fun status(): Map<String, Any?> = mapOf(
    "state" to preferences.getString(STATE, "idle"),
    "sessionId" to preferences.getInt(SESSION_ID, -1).takeIf { it >= 0 },
    "intendedVersionCode" to preferences.getLong(INTENDED_VERSION_CODE, -1L).takeIf { it >= 0 },
    "errorCode" to preferences.getString(ERROR_CODE, null),
    "errorMessage" to preferences.getString(ERROR_MESSAGE, null)
  )

  private fun installedBuildInfo(context: Context): Map<String, Any?> {
    val packageInfo = if (Build.VERSION.SDK_INT >= 33) {
      context.packageManager.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(PackageManager.GET_SIGNING_CERTIFICATES.toLong()))
    } else {
      @Suppress("DEPRECATION") context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_SIGNATURES)
    }
    return mapOf(
      "packageName" to packageInfo.packageName,
      "versionName" to (packageInfo.versionName ?: ""),
      "versionCode" to packageInfo.longVersionCode,
      "certificateSha256" to certificateSha256(packageInfo)
    )
  }

  private fun certificateSha256(packageInfo: PackageInfo): String {
    val signatures = if (Build.VERSION.SDK_INT >= 28) packageInfo.signingInfo?.apkContentsSigners else {
      @Suppress("DEPRECATION") packageInfo.signatures
    }
    val certificate = signatures?.firstOrNull() ?: throw UpdaterException("verification_failed", "App signing certificate is unavailable")
    return ApkVerificationHelper.sha256(certificate.toByteArray())
  }

  private fun Map<String, Any?>.string(key: String) = get(key) as? String ?: throw UpdaterException("invalid_request", "$key is required")
  private fun Map<String, Any?>.long(key: String) = (get(key) as? Number)?.toLong() ?: throw UpdaterException("invalid_request", "$key is required")

  companion object {
    const val PREFERENCES = "liftlog_updater"
    const val CACHE_DIRECTORY = "liftlog-updater"
    const val SESSION_ID = "session_id"
    const val INTENDED_VERSION_CODE = "intended_version_code"
    const val VERIFIED_FILE = "verified_file"
    const val VERIFIED_HASH = "verified_hash"
    const val VERIFIED_VERSION_CODE = "verified_version_code"
    const val STATE = "state"
    const val ERROR_MESSAGE = "error_message"
    const val ERROR_CODE = "error_code"
    const val PENDING_ACTION = "pending_action"
    private const val CALLBACK_REQUEST_CODE = 8401

    private var instance: WeakReference<LiftlogUpdaterModule>? = null

    fun notifyStatusChanged(context: Context, sessionId: Int, versionCode: Long) {
      instance?.get()?.let { module -> module.sendEvent("onInstallationStatusChanged", module.status()) }
    }
  }
}

package expo.modules.liftlogupdater

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream
import java.nio.file.Files
import java.util.zip.ZipFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class LiftlogUpdaterModule : Module() {
  private val context: Context
    get() = appContext.reactContext
      ?: throw UpdaterException("UPDATER_CONTEXT_UNAVAILABLE", "Application context is unavailable")
  private val store: DurableUpdateStore get() = DurableUpdateStore(context)
  private val installer: PackageInstaller get() = context.packageManager.packageInstaller

  override fun definition() = ModuleDefinition {
    val cleanupCoroutine: suspend () -> Map<String, Any?> = { cleanup() }

    Name("LiftlogUpdater")

    AsyncFunction("getInstalledBuildInfoAsync") {
      installedBuildInfo()
    }

    AsyncFunction("getStateAsync") {
      store.state()
    }

    AsyncFunction("reconcileAsync") {
      reconcile()
    }

    AsyncFunction("beginAttemptAsync") Coroutine { request: Map<String, Any?> ->
      beginAttempt(request)
    }

    AsyncFunction("getInstallPermissionAsync") {
      val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
      mapOf(
        "granted" to (!supported || context.packageManager.canRequestPackageInstalls()),
        "settingsSupported" to supported
      )
    }

    Function("openInstallPermissionSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
          data = Uri.parse("package:${context.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
      }
    }

    AsyncFunction("verifyAndStageAsync") Coroutine { request: Map<String, Any?> ->
      verifyAndStage(request)
    }

    AsyncFunction("commitAsync") Coroutine { attemptId: String ->
      commit(attemptId)
    }

    AsyncFunction("cancelAsync") Coroutine { attemptId: String ->
      cancel(attemptId)
    }

    AsyncFunction("cleanupAsync") Coroutine cleanupCoroutine

    OnCreate {
      reconcile()
    }
  }

  private suspend fun beginAttempt(request: Map<String, Any?>): Map<String, Any?> = withContext(Dispatchers.IO) {
    val attemptId = request.string("attemptId")
    val versionName = request.string("targetVersionName")
    val versionCode = request.long("targetVersionCode")
    val sizeBytes = request.long("sizeBytes")
    val sha256 = request.string("sha256").lowercase()
    if (attemptId.isBlank() || versionName.isBlank() || versionCode <= 0 || sizeBytes <= 0 || !sha256.matches(Regex("[0-9a-f]{64}"))) {
      throw UpdaterException("UPDATER_INVALID_REQUEST", "Invalid update metadata")
    }
    if (versionCode <= installedVersionCode()) {
      throw UpdaterException("UPDATER_VERSION_NOT_NEWER", "Target version is not newer")
    }

    val current = reconcile()
    if (store.state()["updateExcluded"] == true) {
      if (store.attemptId() == attemptId) return@withContext current
      throw UpdaterException("UPDATER_ATTEMPT_ACTIVE", "Another update attempt is active")
    }

    cleanupOwnedFiles()
    val directory = ownedDirectory()
    val target = File(directory, UpdaterContract.APK_FILE)
    if (!target.createNewFile()) target.writeBytes(ByteArray(0))
    validateOwnedFile(target, requireFile = true)
    store.begin(attemptId, versionName, versionCode, sizeBytes, sha256, target.canonicalPath)
    store.state()
  }

  private suspend fun verifyAndStage(request: Map<String, Any?>): Map<String, Any?> = withContext(Dispatchers.IO) {
    requireAttempt(request.string("attemptId"))
    if (store.stage() != UpdateStage.DOWNLOADING && store.stage() != UpdateStage.VERIFYING) {
      throw UpdaterException("UPDATER_INVALID_STAGE", "Attempt is not ready for verification")
    }
    val expectedPackage = request.string("expectedPackageName")
    val expectedName = request.string("expectedVersionName")
    val expectedCode = request.long("expectedVersionCode")
    val expectedSize = request.long("expectedSizeBytes")
    val expectedHash = request.string("expectedSha256").lowercase()
    if (
      expectedCode != store.targetVersionCode() ||
      expectedName != store.targetVersionName() ||
      expectedSize != store.expectedSize() ||
      expectedHash != store.expectedHash()
    ) throw UpdaterException("UPDATER_STALE_ATTEMPT", "Target metadata changed")

    val file = File(store.filePath() ?: throw UpdaterException("UPDATER_FILE_MISSING", "APK target is missing"))
    validateOwnedFile(file, requireFile = true)
    store.markVerifying()

    val digest = FileInputStream(file).use(ApkVerification::digest)
    if (digest.sizeBytes != expectedSize) failVerification("UPDATER_SIZE_MISMATCH", "APK size does not match")
    if (digest.sha256 != expectedHash) failVerification("UPDATER_HASH_MISMATCH", "APK checksum does not match")
    val archive = archiveInfo(file)
    val archiveName = archive.versionName ?: ""
    val archiveCode = archive.longVersionCode
    if (archive.packageName != context.packageName || archive.packageName != expectedPackage) {
      failVerification("UPDATER_PACKAGE_MISMATCH", "APK package does not match")
    }
    if (archiveName != expectedName || archiveCode != expectedCode || archiveCode <= installedVersionCode()) {
      failVerification("UPDATER_VERSION_MISMATCH", "APK version does not match")
    }
    if (!isArm64Only(file)) failVerification("UPDATER_ABI_MISMATCH", "APK is not ARM64-only")
    val certificate = certificateSha256(archive)
    if (certificate != certificateSha256(installedPackageInfo())) {
      failVerification("UPDATER_CERTIFICATE_MISMATCH", "APK signer does not match")
    }

    val existingSession = store.sessionId()
    if (existingSession >= 0) {
      throw UpdaterException("UPDATER_SESSION_ACTIVE", "An installer session already exists")
    }
    val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
      setAppPackageName(context.packageName)
      setSize(expectedSize)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED)
      }
    }
    val sessionId = try {
      installer.createSession(params)
    } catch (error: Throwable) {
      throw UpdaterException("UPDATER_STORAGE_FAILURE", "Could not create installer session", error)
    }
    try {
      installer.openSession(sessionId).use { session ->
        session.openWrite("base.apk", 0, expectedSize).use { output ->
          FileInputStream(file).use { input ->
            val stagedDigest = ApkVerification.digest(TeeInputStreamCompat(input, output))
            if (stagedDigest != digest) throw UpdaterException("UPDATER_FILE_CHANGED", "APK changed during staging")
          }
          session.fsync(output)
        }
      }
    } catch (error: Throwable) {
      runCatching { installer.abandonSession(sessionId) }
      if (error is UpdaterException) throw error
      throw UpdaterException("UPDATER_STORAGE_FAILURE", "Could not stage APK", error)
    }
    store.markStaged(sessionId)
    mapOf(
      "packageName" to archive.packageName,
      "versionName" to archiveName,
      "versionCode" to archiveCode,
      "sizeBytes" to digest.sizeBytes,
      "sha256" to digest.sha256,
      "certificateSha256" to certificate,
      "sessionId" to sessionId
    )
  }

  private suspend fun commit(attemptId: String): Map<String, Any?> = withContext(Dispatchers.IO) {
    requireAttempt(attemptId)
    if (store.stage() != UpdateStage.STAGED) throw UpdaterException("UPDATER_INVALID_STAGE", "Attempt is not staged")
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
      throw UpdaterException("UPDATER_PERMISSION_REQUIRED", "Install-source permission is required")
    }
    if (store.targetVersionCode() <= installedVersionCode()) {
      store.finish(UpdateStage.SUCCEEDED, "installed")
      cleanupOwnedFiles()
      return@withContext store.state()
    }
    val sessionId = store.sessionId()
    val sessionInfo = installer.getSessionInfo(sessionId)
      ?: throw UpdaterException("UPDATER_SESSION_MISSING", "Installer session is missing")
    if (sessionInfo.isCommitted) throw UpdaterException("UPDATER_ALREADY_COMMITTED", "Installer session is already committed")

    val callback = Intent(context, InstallationResultReceiver::class.java).apply {
      putExtra(UpdaterContract.EXTRA_ATTEMPT_ID, attemptId)
      putExtra(UpdaterContract.EXTRA_SESSION_ID, sessionId)
    }
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      sessionId,
      callback,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )
    installer.openSession(sessionId).use { it.commit(pendingIntent.intentSender) }
    store.markCommitted()
    store.state()
  }

  private suspend fun cancel(attemptId: String): Map<String, Any?> = withContext(Dispatchers.IO) {
    requireAttempt(attemptId)
    if (store.stage() == UpdateStage.COMMITTED || store.stage() == UpdateStage.PENDING_CONFIRMATION) {
      throw UpdaterException("UPDATER_ANDROID_OWNS_INSTALL", "Android owns the committed installation")
    }
    store.sessionId().takeIf { it >= 0 }?.let { runCatching { installer.abandonSession(it) } }
    store.finish(UpdateStage.CANCELLED, "cancelled")
    cleanupOwnedFiles()
    store.state()
  }

  private fun reconcile(): Map<String, Any?> {
    val target = store.targetVersionCode()
    val current = store.stage()
    val sessionId = store.sessionId()
    val next = UpdateTransitions.reconciledStage(
      current,
      installedVersionCode(),
      target,
      sessionId >= 0 && installer.getSessionInfo(sessionId) != null
    )
    if (next != current) {
      if (next == UpdateStage.INTERRUPTED && sessionId >= 0) {
        runCatching { installer.abandonSession(sessionId) }
      }
      when (next) {
        UpdateStage.SUCCEEDED -> store.finish(next, "installed")
        UpdateStage.FAILED -> store.finish(next, "UPDATER_SESSION_MISSING")
        UpdateStage.INTERRUPTED -> store.finish(next, "interrupted")
        else -> store.setStage(next)
      }
      if (next.isTerminal) cleanupOwnedFiles()
    }
    if (store.stage() == UpdateStage.PENDING_CONFIRMATION) {
      val attemptId = store.attemptId()
      val activity = appContext.currentActivity
      if (attemptId != null && activity != null && !activity.isFinishing) {
        PendingConfirmationRegistry.take(attemptId)?.let { activity.startActivity(it) }
      }
    }
    return store.state()
  }

  private suspend fun cleanup(): Map<String, Any?> = withContext(Dispatchers.IO) {
    val state = reconcile()
    val stage = store.stage()
    if (stage.isTerminal || stage == UpdateStage.IDLE) cleanupOwnedFiles()
    state
  }

  private fun ownedDirectory(): File {
    val directory = File(context.cacheDir, UpdaterContract.CACHE_DIRECTORY)
    if (!directory.exists() && !directory.mkdirs()) throw UpdaterException("UPDATER_STORAGE_FAILURE", "Could not create updater storage")
    if (!directory.isDirectory || Files.isSymbolicLink(directory.toPath())) throw UpdaterException("UPDATER_UNSAFE_PATH", "Updater storage is unsafe")
    return directory.canonicalFile
  }

  private fun validateOwnedFile(file: File, requireFile: Boolean) {
    val directory = ownedDirectory()
    if (Files.isSymbolicLink(file.toPath()) || file.canonicalFile.parentFile != directory || (requireFile && !file.isFile)) {
      throw UpdaterException("UPDATER_UNSAFE_PATH", "APK path is not an owned regular file")
    }
  }

  private fun cleanupOwnedFiles() {
    ownedDirectory().listFiles()?.forEach { file ->
      if (file.isFile && !Files.isSymbolicLink(file.toPath())) file.delete()
    }
  }

  private fun archiveInfo(file: File): PackageInfo =
    context.packageManager.getPackageArchiveInfo(
      file.absolutePath,
      PackageManager.GET_SIGNING_CERTIFICATES or PackageManager.GET_META_DATA
    ) ?: throw UpdaterException("UPDATER_INVALID_APK", "APK manifest could not be read")

  private fun isArm64Only(file: File): Boolean = ZipFile(file).use { zip ->
    val abis = zip.entries().asSequence()
      .map { it.name }
      .filter { it.startsWith("lib/") && it.endsWith(".so") }
      .map { it.substringAfter("lib/").substringBefore('/') }
      .toSet()
    abis == setOf("arm64-v8a")
  }

  private fun installedPackageInfo(): PackageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    context.packageManager.getPackageInfo(
      context.packageName,
      PackageManager.PackageInfoFlags.of(PackageManager.GET_SIGNING_CERTIFICATES.toLong())
    )
  } else {
    @Suppress("DEPRECATION")
    context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
  }

  private fun installedBuildInfo(): Map<String, Any?> {
    val info = installedPackageInfo()
    return mapOf(
      "packageName" to info.packageName,
      "versionName" to (info.versionName ?: ""),
      "versionCode" to info.longVersionCode,
      "certificateSha256" to certificateSha256(info)
    )
  }

  private fun installedVersionCode(): Long = installedPackageInfo().longVersionCode

  private fun certificateSha256(info: PackageInfo): String {
    val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      info.signingInfo?.apkContentsSigners
    } else {
      @Suppress("DEPRECATION") info.signatures
    }
    val signature = signatures?.singleOrNull()
      ?: throw UpdaterException("UPDATER_CERTIFICATE_UNAVAILABLE", "A single signing certificate is required")
    return ApkVerification.digest(signature.toByteArray().inputStream()).sha256
  }

  private fun requireAttempt(attemptId: String) {
    if (store.attemptId() != attemptId) throw UpdaterException("UPDATER_STALE_ATTEMPT", "Attempt identity does not match")
  }

  private fun failVerification(code: String, message: String): Nothing {
    store.finish(UpdateStage.FAILED, code)
    cleanupOwnedFiles()
    throw UpdaterException(code, message)
  }

  private fun Map<String, Any?>.string(key: String): String =
    get(key) as? String ?: throw UpdaterException("UPDATER_INVALID_REQUEST", "$key is required")

  private fun Map<String, Any?>.long(key: String): Long =
    (get(key) as? Number)?.toLong() ?: throw UpdaterException("UPDATER_INVALID_REQUEST", "$key is required")
}

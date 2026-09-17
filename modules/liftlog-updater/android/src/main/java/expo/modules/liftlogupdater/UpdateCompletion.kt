package expo.modules.liftlogupdater

import java.nio.charset.StandardCharsets
import java.util.Base64

internal data class UpdateCompletionAcknowledgement(
  val attemptId: String,
  val installedVersionName: String,
  val installedVersionCode: Long
) {
  fun toMap(): Map<String, Any> = mapOf(
    "attemptId" to attemptId,
    "installedVersionName" to installedVersionName,
    "installedVersionCode" to installedVersionCode
  )
}

internal sealed interface PackageReplacementResult {
  data object Ignored : PackageReplacementResult
  data object Unproven : PackageReplacementResult
  data class Succeeded(val completion: UpdateCompletionAcknowledgement) : PackageReplacementResult
}

internal object InstallerResultHandling {
  fun packageReplaced(
    stage: UpdateStage,
    attemptId: String?,
    targetVersionCode: Long,
    installedVersionName: String,
    installedVersionCode: Long
  ): PackageReplacementResult {
    if (
      attemptId == null ||
      targetVersionCode <= 0 ||
      (stage != UpdateStage.COMMITTED && stage != UpdateStage.PENDING_CONFIRMATION)
    ) {
      return PackageReplacementResult.Ignored
    }
    if (installedVersionCode < targetVersionCode) {
      return PackageReplacementResult.Unproven
    }

    return PackageReplacementResult.Succeeded(
      UpdateCompletionAcknowledgement(attemptId, installedVersionName, installedVersionCode)
    )
  }
}

internal object UpdateCompletionCodec {
  private val encoder = Base64.getUrlEncoder().withoutPadding()
  private val decoder = Base64.getUrlDecoder()

  fun encode(completion: UpdateCompletionAcknowledgement): String = listOf(
    completion.attemptId,
    completion.installedVersionName,
    completion.installedVersionCode.toString()
  ).joinToString("|") { encoder.encodeToString(it.toByteArray(StandardCharsets.UTF_8)) }

  fun decode(value: String): UpdateCompletionAcknowledgement? = runCatching {
    val fields = value.split('|')
    if (fields.size != 3) return null
    UpdateCompletionAcknowledgement(
      attemptId = fields[0].decode(),
      installedVersionName = fields[1].decode(),
      installedVersionCode = fields[2].decode().toLong()
    )
  }.getOrNull()

  private fun String.decode(): String = String(decoder.decode(this), StandardCharsets.UTF_8)
}

internal enum class CompletionNotificationOutcome(val resultCode: String) {
  POSTED("UPDATER_COMPLETION_NOTIFICATION_POSTED"),
  PERMISSION_UNAVAILABLE("UPDATER_COMPLETION_NOTIFICATION_PERMISSION_UNAVAILABLE"),
  LAUNCHER_UNAVAILABLE("UPDATER_COMPLETION_LAUNCHER_UNAVAILABLE"),
  POST_FAILED("UPDATER_COMPLETION_NOTIFICATION_FAILED")
}

internal object CompletionNotificationDecision {
  fun decide(
    permissionGranted: Boolean,
    launcherAvailable: Boolean
  ): CompletionNotificationOutcome = when {
    !permissionGranted -> CompletionNotificationOutcome.PERMISSION_UNAVAILABLE
    !launcherAvailable -> CompletionNotificationOutcome.LAUNCHER_UNAVAILABLE
    else -> CompletionNotificationOutcome.POSTED
  }
}

internal interface UpdateCompletionEffects {
  fun persist(completion: UpdateCompletionAcknowledgement)
  fun cleanup()
  fun postNotification(): CompletionNotificationOutcome
  fun appendDiagnostic(diagnostic: UpdateDiagnostic)
}

internal class UpdateCompletionHandler(
  private val effects: UpdateCompletionEffects,
  private val createDiagnosticId: () -> String,
  private val now: () -> Long,
  private val onFailure: (Throwable) -> Unit = {}
) {
  fun complete(result: PackageReplacementResult): Boolean {
    val completion = (result as? PackageReplacementResult.Succeeded)?.completion
      ?: return false

    effects.persist(completion)
    runCatching(effects::cleanup).onFailure(onFailure)
    val notificationOutcome = runCatching(effects::postNotification)
      .onFailure(onFailure)
      .getOrDefault(CompletionNotificationOutcome.POST_FAILED)
    runCatching {
      effects.appendDiagnostic(
        CompletionDiagnosticFactory.create(
          completion,
          notificationOutcome,
          createDiagnosticId(),
          now()
        )
      )
    }.onFailure(onFailure)
    return true
  }
}

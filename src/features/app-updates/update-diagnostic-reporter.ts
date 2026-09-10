import type {
  InstalledBuildInfo,
  PendingUpdateDiagnostics,
  UpdateFailureDiagnostic
} from '@/modules/liftlog-updater/src/types';

interface DiagnosticCaptureContext {
  level: 'error';
  fingerprint: string[];
  tags: {
    feature: 'app_updates';
    operation: UpdateFailureDiagnostic['source'];
    stage: UpdateFailureDiagnostic['nativeStage'];
    updater_error_code: string;
  };
  extra: Record<string, boolean | number | string>;
}

interface UpdateDiagnosticReporterDependencies {
  getPendingDiagnostics(): Promise<PendingUpdateDiagnostics>;
  acknowledge(attemptId: string, diagnosticId: string): Promise<boolean>;
  captureMessage(
    message: string,
    context: DiagnosticCaptureContext
  ): string | undefined;
  getInstalledBuildInfo(): Promise<InstalledBuildInfo>;
  androidApiLevel: number | string;
  now(): number;
  consoleError(message: string, error: unknown): void;
}

const URI = /\b[a-z][a-z0-9+.-]*(?::\/\/|:)\S+/gi;
const ABSOLUTE_PATH = /(^|\s)\/(?:[^\s/]+\/)*[^\s]+/g;
const LONG_HASH = /\b(?:[0-9a-f]{32,}|(?:[0-9a-f]{2}:){15,}[0-9a-f]{2})\b/gi;
const SENSITIVE_VALUE =
  /\b(?:bearer\s+\S+|(?:access[_-]?token|refresh[_-]?token|token|api[_-]?key|password|passwd|credential|secret|authorization)\s*[:=]\s*\S+)/gi;
const PACKAGE_IDENTIFIER =
  /\b[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+\b/g;

function sanitizedStatusMessage(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const sanitized = value
    .replace(URI, '[redacted]')
    .replace(ABSOLUTE_PATH, '$1[redacted]')
    .replace(LONG_HASH, '[redacted]')
    .replace(SENSITIVE_VALUE, '[redacted]')
    .replace(PACKAGE_IDENTIFIER, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 512);

  return sanitized || undefined;
}

function captureContext(
  diagnostic: UpdateFailureDiagnostic,
  droppedDiagnosticCount: number,
  installedBuild: InstalledBuildInfo | undefined,
  androidApiLevel: number | string,
  now: number
): DiagnosticCaptureContext {
  const statusMessage = sanitizedStatusMessage(diagnostic.statusMessage);

  return {
    level: 'error',
    fingerprint: [
      'UPDATE_INSTALL_FAILED',
      diagnostic.resultCode,
      diagnostic.nativeStage,
      String(diagnostic.rawStatus ?? 'unknown')
    ],
    tags: {
      feature: 'app_updates',
      operation: diagnostic.source,
      stage: diagnostic.nativeStage,
      updater_error_code: diagnostic.resultCode
    },
    extra: {
      attemptId: diagnostic.attemptId,
      diagnosticId: diagnostic.diagnosticId,
      occurredAt: diagnostic.occurredAt,
      diagnosticAgeMillis: Math.max(0, now - diagnostic.occurredAt),
      droppedDiagnosticCount,
      ...(installedBuild
        ? {
            installedVersionName: installedBuild.versionName,
            installedVersionCode: installedBuild.versionCode
          }
        : {}),
      ...(diagnostic.targetVersionName
        ? { targetVersionName: diagnostic.targetVersionName }
        : {}),
      ...(diagnostic.targetVersionCode !== null
        ? { targetVersionCode: diagnostic.targetVersionCode }
        : {}),
      androidApiLevel,
      ...(installedBuild ? { isDebuggable: installedBuild.isDebuggable } : {}),
      ...(diagnostic.rawStatus !== null
        ? { rawInstallerStatus: diagnostic.rawStatus }
        : {}),
      ...(statusMessage ? { installerStatusMessage: statusMessage } : {}),
      ...(diagnostic.blockingPackage
        ? { blockingPackage: diagnostic.blockingPackage }
        : {}),
      ...(diagnostic.storageLocation
        ? { storageLocation: diagnostic.storageLocation }
        : {})
    }
  };
}

export function createUpdateDiagnosticReporter(
  dependencies: UpdateDiagnosticReporterDependencies
) {
  let inFlight: Promise<void> | undefined;

  const safelyLog = (message: string, error: unknown) => {
    try {
      dependencies.consoleError(message, error);
    } catch {
      // Observability fallback must never escape into the update flow.
    }
  };

  const drain = async () => {
    let pending: PendingUpdateDiagnostics;

    try {
      pending = await dependencies.getPendingDiagnostics();
    } catch (error) {
      safelyLog('Failed to read application update diagnostics', error);

      return;
    }

    const diagnostic = pending.diagnostics[0];

    if (!diagnostic) {
      return;
    }

    let installedBuild: InstalledBuildInfo | undefined;

    try {
      installedBuild = await dependencies.getInstalledBuildInfo();
    } catch (error) {
      safelyLog('Failed to enrich application update diagnostic', error);
    }

    let eventId: string | undefined;

    try {
      eventId = dependencies.captureMessage(
        'UPDATE_INSTALL_FAILED',
        captureContext(
          diagnostic,
          pending.droppedDiagnosticCount,
          installedBuild,
          dependencies.androidApiLevel,
          dependencies.now()
        )
      );
    } catch (error) {
      safelyLog('Failed to report application update diagnostic', error);

      return;
    }

    if (!eventId?.trim()) {
      return;
    }

    try {
      await dependencies.acknowledge(
        diagnostic.attemptId,
        diagnostic.diagnosticId
      );
    } catch (error) {
      safelyLog('Failed to acknowledge application update diagnostic', error);
    }
  };

  return {
    drainOne(): Promise<void> {
      if (!inFlight) {
        inFlight = drain().finally(() => {
          inFlight = undefined;
        });
      }

      return inFlight;
    }
  };
}

import type {
  InstalledBuildInfo,
  NativeUpdateState
} from '@/modules/liftlog-updater/src/types';
import type { UpdateAttemptFailure } from './update-attempt-coordinator';
import type { ReconciliationOperation } from './update-lifecycle';

interface CaptureContext {
  level: 'error';
  tags: {
    feature: 'app_updates';
    operation: UpdateAttemptFailure['operation'] | ReconciliationOperation;
    stage: UpdateAttemptFailure['stage'] | 'reconcile';
    updater_error_code: string;
  };
  extra: Record<string, boolean | number | string | null>;
}

interface AppUpdateReporterDependencies {
  captureException(error: unknown, context: CaptureContext): string;
  captureMessage(message: string, context: CaptureContext): string;
  getInstalledBuildInfo(): Promise<InstalledBuildInfo>;
  getNativeState?(): Promise<NativeUpdateState>;
  androidApiLevel: number | string;
  consoleError(message: string, error: unknown): void;
}

function captureContext(
  failure: UpdateAttemptFailure,
  installedBuild: InstalledBuildInfo | undefined,
  androidApiLevel: number | string
): CaptureContext {
  return {
    level: 'error',
    tags: {
      feature: 'app_updates',
      operation: failure.operation,
      stage: failure.stage,
      updater_error_code: failure.errorCode
    },
    extra: {
      attemptId: failure.attemptId,
      ...(installedBuild
        ? {
            installedVersionName: installedBuild.versionName,
            installedVersionCode: installedBuild.versionCode
          }
        : {}),
      targetVersionName: failure.targetVersionName,
      targetVersionCode: failure.targetVersionCode,
      androidApiLevel,
      ...(installedBuild ? { isDebuggable: installedBuild.isDebuggable } : {}),
      candidateSignerMatchesInstalled: failure.candidateSignerMatchesInstalled
    }
  };
}

export function createAppUpdateReporter(
  dependencies: AppUpdateReporterDependencies
) {
  const safelyLog = (message: string, error: unknown) => {
    try {
      dependencies.consoleError(message, error);
    } catch {
      // Observability fallback must never escape into the update flow.
    }
  };

  return {
    reportUnexpected(failure: UpdateAttemptFailure): void {
      void (async () => {
        let installedBuild: InstalledBuildInfo | undefined;

        try {
          installedBuild = await dependencies.getInstalledBuildInfo();
        } catch (error) {
          safelyLog('Failed to enrich application update error', error);
        }

        try {
          const context = captureContext(
            failure,
            installedBuild,
            dependencies.androidApiLevel
          );

          if (failure.error instanceof Error) {
            dependencies.captureException(failure.error, context);
          } else {
            dependencies.captureMessage('UPDATE_ATTEMPT_FAILED', context);
          }
        } catch (error) {
          safelyLog('Failed to report application update error', error);
        }
      })();
    },
    reportReconciliationFailure(
      error: unknown,
      operation: ReconciliationOperation
    ): void {
      void (async () => {
        let installedBuild: InstalledBuildInfo | undefined;
        let nativeState: NativeUpdateState | undefined;

        try {
          [installedBuild, nativeState] = await Promise.all([
            dependencies.getInstalledBuildInfo().catch(enrichmentError => {
              safelyLog(
                'Failed to enrich application update reconciliation error',
                enrichmentError
              );

              return undefined;
            }),
            dependencies.getNativeState?.().catch(enrichmentError => {
              safelyLog(
                'Failed to read application update reconciliation state',
                enrichmentError
              );

              return undefined;
            }) ?? Promise.resolve(undefined)
          ]);

          const context: CaptureContext = {
            level: 'error',
            tags: {
              feature: 'app_updates',
              operation,
              stage: 'reconcile',
              updater_error_code: 'UPDATE_RECONCILIATION_FAILED'
            },
            extra: {
              ...(nativeState?.attemptId
                ? { attemptId: nativeState.attemptId }
                : {}),
              ...(installedBuild
                ? {
                    installedVersionName: installedBuild.versionName,
                    installedVersionCode: installedBuild.versionCode
                  }
                : {}),
              ...(nativeState?.targetVersionName
                ? { targetVersionName: nativeState.targetVersionName }
                : {}),
              ...(nativeState?.targetVersionCode !== null && nativeState
                ? { targetVersionCode: nativeState.targetVersionCode }
                : {}),
              ...(nativeState ? { nativeStage: nativeState.stage } : {}),
              androidApiLevel: dependencies.androidApiLevel,
              ...(installedBuild
                ? { isDebuggable: installedBuild.isDebuggable }
                : {})
            }
          };

          if (error instanceof Error) {
            dependencies.captureException(error, context);
          } else {
            dependencies.captureMessage(
              'UPDATE_RECONCILIATION_FAILED',
              context
            );
          }
        } catch (reportingError) {
          safelyLog(
            'Failed to report application update reconciliation error',
            reportingError
          );
        }
      })();
    }
  };
}

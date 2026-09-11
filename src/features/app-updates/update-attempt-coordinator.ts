import type {
  InstallPermissionStatus,
  NativeUpdateState,
  VerificationResult
} from '@/modules/liftlog-updater/src/types';
import type { ExclusionResult } from './update-exclusion';
import type { AvailableUpdate } from './update.types';

export type UpdateAttemptStatus =
  | 'idle'
  | 'permission'
  | 'downloading'
  | 'verifying'
  | 'staging'
  | 'installer'
  | 'interrupted'
  | 'cancelled'
  | 'failed'
  | 'succeeded';

export interface UpdateAttemptState {
  status: UpdateAttemptStatus;
  attemptId?: string;
  release?: AvailableUpdate;
  targetVersionCode?: number;
  bytesDownloaded?: number;
  totalBytes?: number;
  progress?: number;
  blockReason?: Extract<ExclusionResult, { status: 'blocked' }>['reason'];
  errorCode?: string;
}

export type UpdateAttemptOperation =
  | 'start'
  | 'resume_permission'
  | 'foreground_commit';

export type UpdateAttemptFailureStage =
  | 'begin'
  | 'permission'
  | 'download'
  | 'verification'
  | 'commit';

export interface UpdateAttemptFailure {
  error: unknown;
  operation: UpdateAttemptOperation;
  stage: UpdateAttemptFailureStage;
  errorCode: string;
  attemptId: string;
  targetVersionName: string;
  targetVersionCode: number;
  candidateSignerMatchesInstalled: boolean | null;
}

interface DownloadTask {
  promise: Promise<void>;
  cancel(): Promise<void>;
}

export interface UpdateAttemptDependencies {
  createAttemptId(): string;
  begin(request: {
    attemptId: string;
    targetVersionName: string;
    targetVersionCode: number;
    sizeBytes: number;
    sha256: string;
  }): Promise<ExclusionResult>;
  permission(): Promise<InstallPermissionStatus>;
  openPermissionSettings(): void;
  download(
    url: string,
    fileUri: string,
    onProgress: (written: number, expected: number) => void
  ): DownloadTask;
  verify(request: {
    attemptId: string;
    expectedVersionName: string;
    expectedVersionCode: number;
    expectedSizeBytes: number;
    expectedSha256: string;
  }): Promise<VerificationResult | void>;
  commit(attemptId: string): Promise<ExclusionResult>;
  cancel(attemptId: string): Promise<NativeUpdateState>;
  interrupt(attemptId: string): Promise<NativeUpdateState>;
  getState(): Promise<NativeUpdateState>;
  reconcile(): Promise<NativeUpdateState>;
  reportUnexpected(failure: UpdateAttemptFailure): void;
}

interface FailureContext {
  operation: UpdateAttemptOperation;
  stage: UpdateAttemptFailureStage;
  candidateSignerMatchesInstalled: boolean | null;
}

const KNOWN_UPDATER_ERROR_CODES = new Set([
  'UPDATER_ABI_MISMATCH',
  'UPDATER_ALREADY_COMMITTED',
  'UPDATER_ANDROID_OWNS_INSTALL',
  'UPDATER_ATTEMPT_ACTIVE',
  'UPDATER_CANCELLED',
  'UPDATER_CERTIFICATE_MISMATCH',
  'UPDATER_CERTIFICATE_UNAVAILABLE',
  'UPDATER_CONFIRMATION_MISSING',
  'UPDATER_CONFIRMATION_UNAVAILABLE',
  'UPDATER_CONTEXT_UNAVAILABLE',
  'UPDATER_FILE_CHANGED',
  'UPDATER_FILE_MISSING',
  'UPDATER_FOREGROUND_REQUIRED',
  'UPDATER_HASH_MISMATCH',
  'UPDATER_INCOMPATIBLE_APK',
  'UPDATER_INSTALL_BLOCKED',
  'UPDATER_INSTALL_CANCELLED',
  'UPDATER_INSTALL_CONFLICT',
  'UPDATER_INSTALL_FAILED',
  'UPDATER_INSTALL_TIMEOUT',
  'UPDATER_INTERRUPTED',
  'UPDATER_INVALID_APK',
  'UPDATER_INVALID_REQUEST',
  'UPDATER_INVALID_STAGE',
  'UPDATER_PACKAGE_MISMATCH',
  'UPDATER_PERMISSION_REQUIRED',
  'UPDATER_SESSION_ACTIVE',
  'UPDATER_SESSION_MISSING',
  'UPDATER_SIZE_MISMATCH',
  'UPDATER_STALE_ATTEMPT',
  'UPDATER_STATE_WRITE_FAILED',
  'UPDATER_STORAGE_FAILURE',
  'UPDATER_UNSAFE_PATH',
  'UPDATER_VERSION_MISMATCH',
  'UPDATER_VERSION_NOT_NEWER'
]);

function updaterErrorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    typeof error.code === 'string' &&
    KNOWN_UPDATER_ERROR_CODES.has(error.code)
  ) {
    return error.code;
  }

  return 'UPDATE_UNEXPECTED';
}

function terminalState(native: NativeUpdateState): UpdateAttemptState {
  const status = native.stage;

  if (
    status === 'succeeded' ||
    status === 'cancelled' ||
    status === 'interrupted' ||
    status === 'failed'
  ) {
    return {
      status,
      attemptId: native.attemptId ?? undefined,
      targetVersionCode: native.targetVersionCode ?? undefined,
      errorCode: native.resultCode ?? undefined
    };
  }

  return {
    status:
      status === 'committed' || status === 'pending_confirmation'
        ? 'installer'
        : status === 'verifying'
          ? 'verifying'
          : status === 'staged'
            ? 'staging'
            : status === 'downloading'
              ? 'interrupted'
              : 'idle',
    attemptId: native.attemptId ?? undefined,
    targetVersionCode: native.targetVersionCode ?? undefined
  };
}

export function createUpdateAttemptCoordinator(
  dependencies: UpdateAttemptDependencies
) {
  let state: UpdateAttemptState = { status: 'idle' };
  let task: DownloadTask | undefined;
  let generation = 0;
  let appActive = true;
  const listeners = new Set<(next: UpdateAttemptState) => void>();

  const publish = (next: UpdateAttemptState) => {
    state = next;
    listeners.forEach(listener => listener(next));
  };

  const runAfterPermission = async (
    attemptId: string,
    release: AvailableUpdate,
    fileUri: string,
    runGeneration: number,
    failureContext: FailureContext
  ) => {
    failureContext.stage = 'permission';
    const permission = await dependencies.permission();

    if (runGeneration !== generation) {
      return;
    }

    if (!permission.granted) {
      publish({ status: 'permission', attemptId, release });

      if (permission.settingsSupported) {
        dependencies.openPermissionSettings();
      }

      return;
    }

    publish({
      status: 'downloading',
      attemptId,
      release,
      bytesDownloaded: 0,
      totalBytes: release.sizeBytes,
      progress: 0
    });
    failureContext.stage = 'download';
    task = dependencies.download(
      release.apkDownloadUrl,
      fileUri,
      (written, expected) => {
        if (runGeneration !== generation || state.status !== 'downloading') {
          return;
        }

        const total = expected > 0 ? expected : release.sizeBytes;
        publish({
          ...state,
          bytesDownloaded: written,
          totalBytes: total,
          progress: Math.min(1, written / total)
        });
      }
    );

    try {
      await task.promise;
    } catch (error) {
      if (runGeneration !== generation) {
        return;
      }

      throw error;
    }

    if (runGeneration !== generation) {
      return;
    }

    task = undefined;
    publish({ status: 'verifying', attemptId, release });
    failureContext.stage = 'verification';
    await dependencies.verify({
      attemptId,
      expectedVersionName: release.versionName,
      expectedVersionCode: release.versionCode,
      expectedSizeBytes: release.sizeBytes,
      expectedSha256: release.sha256
    });
    failureContext.candidateSignerMatchesInstalled = true;

    if (runGeneration !== generation) {
      return;
    }

    publish({ status: 'staging', attemptId, release });

    if (!appActive) {
      return;
    }

    await commit(attemptId, release, runGeneration, failureContext);
  };

  const commit = async (
    attemptId: string,
    release: AvailableUpdate,
    runGeneration: number,
    failureContext: FailureContext
  ) => {
    failureContext.stage = 'commit';
    const committed = await dependencies.commit(attemptId);

    if (runGeneration !== generation) {
      return;
    }

    if (committed.status === 'committed') {
      publish({ status: 'installer', attemptId, release });
    } else if (committed.status === 'blocked') {
      publish({
        status: 'failed',
        attemptId,
        release,
        blockReason: committed.reason
      });
    } else {
      throw new Error('Unexpected commit result');
    }
  };

  const safelyRun = async (
    operation: () => Promise<void>,
    attemptId: string,
    release: AvailableUpdate,
    failureContext: FailureContext
  ) => {
    try {
      await operation();
    } catch (error) {
      const code = updaterErrorCode(error);
      dependencies.reportUnexpected({
        error,
        operation: failureContext.operation,
        stage: failureContext.stage,
        errorCode: code,
        attemptId,
        targetVersionName: release.versionName,
        targetVersionCode: release.versionCode,
        candidateSignerMatchesInstalled:
          code === 'UPDATER_CERTIFICATE_MISMATCH'
            ? false
            : failureContext.candidateSignerMatchesInstalled
      });
      publish({ ...state, status: 'failed', errorCode: code });
    }
  };

  return {
    getState: () => state,
    subscribe(listener: (next: UpdateAttemptState) => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    async start(release: AvailableUpdate) {
      if (
        state.status !== 'idle' &&
        state.status !== 'interrupted' &&
        state.status !== 'failed' &&
        state.status !== 'cancelled' &&
        state.status !== 'succeeded'
      ) {
        return;
      }

      const attemptId = dependencies.createAttemptId();
      const runGeneration = ++generation;
      const failureContext: FailureContext = {
        operation: 'start',
        stage: 'begin',
        candidateSignerMatchesInstalled: null
      };
      await safelyRun(
        async () => {
          const begun = await dependencies.begin({
            attemptId,
            targetVersionName: release.versionName,
            targetVersionCode: release.versionCode,
            sizeBytes: release.sizeBytes,
            sha256: release.sha256
          });

          if (runGeneration !== generation) {
            return;
          }

          if (begun.status === 'blocked') {
            publish({
              status: 'failed',
              attemptId,
              release,
              blockReason: begun.reason
            });

            return;
          }

          if (begun.status !== 'started') {
            throw new Error('Unexpected begin result');
          }

          const fileUri = begun.state.fileUri;

          if (!fileUri) {
            throw Object.assign(new Error('Missing native download target'), {
              code: 'UPDATER_FILE_MISSING'
            });
          }

          await runAfterPermission(
            attemptId,
            release,
            fileUri,
            runGeneration,
            failureContext
          );
        },
        attemptId,
        release,
        failureContext
      );
    },
    async resumePermission() {
      if (state.status !== 'permission' || !state.attemptId || !state.release) {
        return;
      }

      const attemptId = state.attemptId;
      const release = state.release;
      const failureContext: FailureContext = {
        operation: 'resume_permission',
        stage: 'permission',
        candidateSignerMatchesInstalled: null
      };
      await safelyRun(
        async () => {
          const native = await dependencies.getState();
          const fileUri = native.fileUri;

          if (!fileUri || native.attemptId !== attemptId) {
            publish(terminalState(native));

            return;
          }

          await runAfterPermission(
            attemptId,
            release,
            fileUri,
            generation,
            failureContext
          );
        },
        attemptId,
        release,
        failureContext
      );
    },
    async cancel() {
      if (
        !state.attemptId ||
        !['permission', 'downloading', 'verifying', 'staging'].includes(
          state.status
        )
      ) {
        return;
      }

      const attemptId = state.attemptId;
      generation += 1;
      await task?.cancel();
      task = undefined;
      publish(terminalState(await dependencies.cancel(attemptId)));
    },
    async backgrounded() {
      appActive = false;

      if (state.status !== 'downloading' || !state.attemptId) {
        return;
      }

      const attemptId = state.attemptId;
      generation += 1;
      await task?.cancel();
      task = undefined;
      publish(terminalState(await dependencies.interrupt(attemptId)));
    },
    async foregrounded() {
      appActive = true;

      if (state.status === 'permission') {
        await this.resumePermission();
      } else if (
        state.status === 'staging' &&
        state.attemptId &&
        state.release
      ) {
        const failureContext: FailureContext = {
          operation: 'foreground_commit',
          stage: 'commit',
          candidateSignerMatchesInstalled: true
        };
        await safelyRun(
          () =>
            commit(
              state.attemptId!,
              state.release!,
              generation,
              failureContext
            ),
          state.attemptId,
          state.release,
          failureContext
        );
      } else {
        await this.reconcile();
      }
    },
    async reconcile() {
      publish(terminalState(await dependencies.reconcile()));
    }
  };
}

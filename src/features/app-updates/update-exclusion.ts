import type {
  BeginAttemptRequest,
  LiftlogUpdaterApi,
  NativeUpdateState
} from '@/modules/liftlog-updater/src/types';

export type UpdateBlockReason =
  | 'not_ready'
  | 'update_in_progress'
  | 'transient_workout_edit'
  | 'active_workout'
  | 'permission_required'
  | 'stale_attempt'
  | 'version_changed';

export class WorkoutCreationBlockedError extends Error {
  constructor() {
    super('A workout cannot be started while an application update is active.');
    this.name = 'WorkoutCreationBlockedError';
  }
}

interface EditorRegistration {
  setDirty(dirty: boolean): void;
  unregister(): void;
}

export class UpdateExclusionLatch {
  private hydrated = false;
  private updateExcluded = false;
  private readonly dirtyEditors = new Set<symbol>();

  hydrate(updateExcluded: boolean): void {
    this.updateExcluded = updateExcluded;
    this.hydrated = true;
  }

  getUpdateBlockReason(): UpdateBlockReason | undefined {
    if (!this.hydrated) {
      return 'not_ready';
    }

    if (this.updateExcluded) {
      return 'update_in_progress';
    }

    if (this.dirtyEditors.size > 0) {
      return 'transient_workout_edit';
    }

    return undefined;
  }

  tryClaimUpdate(): UpdateBlockReason | undefined {
    const reason = this.getUpdateBlockReason();

    if (!reason) {
      this.updateExcluded = true;
    }

    return reason;
  }

  reconcile(updateExcluded: boolean): void {
    this.updateExcluded = updateExcluded;
  }

  releaseUpdate(): void {
    this.updateExcluded = false;
  }

  canCreateWorkout(): boolean {
    return this.hydrated && !this.updateExcluded;
  }

  assertWorkoutCreationAllowed(): void {
    if (!this.canCreateWorkout()) {
      throw new WorkoutCreationBlockedError();
    }
  }

  registerEditor(): EditorRegistration {
    const token = Symbol('workout-editor');

    return {
      setDirty: dirty => {
        if (dirty) {
          this.dirtyEditors.add(token);
        } else {
          this.dirtyEditors.delete(token);
        }
      },
      unregister: () => {
        this.dirtyEditors.delete(token);
      }
    };
  }
}

export const applicationUpdateExclusion = new UpdateExclusionLatch();

export type ExclusionResult =
  | { status: 'started'; state: NativeUpdateState }
  | { status: 'committed'; state: NativeUpdateState }
  | { status: 'blocked'; reason: UpdateBlockReason };

interface UpdateExclusionDependencies {
  latch: UpdateExclusionLatch;
  nativeUpdater: LiftlogUpdaterApi;
  hasActiveWorkout(): boolean;
}

export function createUpdateExclusionCoordinator({
  latch,
  nativeUpdater,
  hasActiveWorkout
}: UpdateExclusionDependencies) {
  const reconcileLatch = async (): Promise<NativeUpdateState> => {
    const state = await nativeUpdater.getStateAsync();

    latch.reconcile(state.updateExcluded);

    return state;
  };

  const cancelAttempt = async (
    attemptId: string
  ): Promise<NativeUpdateState> => {
    try {
      const state = await nativeUpdater.cancelAsync(attemptId);

      latch.reconcile(state.updateExcluded);

      return state;
    } catch (error) {
      try {
        await reconcileLatch();
      } catch {
        // Keep the existing exclusion when native ownership is unknown.
      }

      throw error;
    }
  };

  return {
    async hydrate(): Promise<NativeUpdateState> {
      const state = await nativeUpdater.reconcileAsync();

      latch.hydrate(state.updateExcluded);

      return state;
    },

    async begin(request: BeginAttemptRequest): Promise<ExclusionResult> {
      const reason = latch.tryClaimUpdate();

      if (reason) {
        return { status: 'blocked', reason };
      }

      try {
        const state = await nativeUpdater.beginAttemptAsync(request);

        if (hasActiveWorkout()) {
          await cancelAttempt(request.attemptId);

          return { status: 'blocked', reason: 'active_workout' };
        }

        latch.reconcile(state.updateExcluded);

        return { status: 'started', state };
      } catch (error) {
        try {
          await reconcileLatch();
        } catch {
          // Keep the claimed exclusion when native ownership is unknown.
        }

        throw error;
      }
    },

    async commit(attemptId: string): Promise<ExclusionResult> {
      if (hasActiveWorkout()) {
        await cancelAttempt(attemptId);

        return { status: 'blocked', reason: 'active_workout' };
      }

      const permission = await nativeUpdater.getInstallPermissionAsync();

      if (!permission.granted) {
        return { status: 'blocked', reason: 'permission_required' };
      }

      const installed = await nativeUpdater.getInstalledBuildInfoAsync();
      const state = await nativeUpdater.getStateAsync();

      if (state.attemptId !== attemptId || !state.updateExcluded) {
        latch.reconcile(state.updateExcluded);

        return { status: 'blocked', reason: 'stale_attempt' };
      }

      if (
        state.targetVersionCode === null ||
        installed.versionCode >= state.targetVersionCode
      ) {
        const reconciled = await nativeUpdater.reconcileAsync();

        latch.reconcile(reconciled.updateExcluded);

        return { status: 'blocked', reason: 'version_changed' };
      }

      if (hasActiveWorkout()) {
        await cancelAttempt(attemptId);

        return { status: 'blocked', reason: 'active_workout' };
      }

      let committed: NativeUpdateState;

      try {
        committed = await nativeUpdater.commitAsync(attemptId);
      } catch (error) {
        try {
          latch.reconcile((await nativeUpdater.getStateAsync()).updateExcluded);
        } catch {
          // Keep exclusion when native state cannot be determined safely.
        }

        throw error;
      }

      latch.reconcile(committed.updateExcluded);

      return { status: 'committed', state: committed };
    },

    async cancel(attemptId: string): Promise<NativeUpdateState> {
      return cancelAttempt(attemptId);
    }
  };
}

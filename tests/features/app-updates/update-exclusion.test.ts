import {
  createUpdateExclusionCoordinator,
  UpdateExclusionLatch
} from '@/src/features/app-updates/update-exclusion';
import type {
  BeginAttemptRequest,
  LiftlogUpdaterApi,
  NativeUpdateState
} from '@/modules/liftlog-updater/src/types';
import assert from 'node:assert/strict';
import test from 'node:test';

const REQUEST: BeginAttemptRequest = {
  attemptId: 'attempt-a',
  targetVersionName: '1.1.0',
  targetVersionCode: 11,
  sizeBytes: 100,
  sha256: 'a'.repeat(64)
};

function state(
  stage: NativeUpdateState['stage'],
  overrides: Partial<NativeUpdateState> = {}
): NativeUpdateState {
  return {
    attemptId: stage === 'idle' ? null : REQUEST.attemptId,
    stage,
    targetVersionName: stage === 'idle' ? null : REQUEST.targetVersionName,
    targetVersionCode: stage === 'idle' ? null : REQUEST.targetVersionCode,
    fileUri: null,
    sessionId: null,
    pendingConfirmation: false,
    updateExcluded: stage !== 'idle',
    resultCode: null,
    ...overrides
  };
}

function nativeFake(initial = state('idle')) {
  let current = initial;
  const calls: string[] = [];
  const api: LiftlogUpdaterApi = {
    async getInstalledBuildInfoAsync() {
      calls.push('installed');

      return {
        packageName: 'com.liftlog',
        versionName: '1.0.0',
        versionCode: 10,
        certificateSha256: 'certificate',
        isDebuggable: false
      };
    },
    async getStateAsync() {
      calls.push('state');

      return current;
    },
    async getPendingDiagnosticsAsync() {
      return { diagnostics: [], droppedDiagnosticCount: 0 };
    },
    async acknowledgeDiagnosticAsync() {
      return false;
    },
    async cancelCompletionNotificationAsync() {},
    async getCompletionAsync() {
      return null;
    },
    async acknowledgeCompletionAsync() {
      return false;
    },
    async reconcileAsync() {
      calls.push('reconcile');

      return current;
    },
    async beginAttemptAsync(request) {
      calls.push('begin');
      current = state('downloading', { attemptId: request.attemptId });

      return current;
    },
    async getInstallPermissionAsync() {
      calls.push('permission');

      return { granted: true, settingsSupported: true };
    },
    openInstallPermissionSettings() {},
    async verifyAndStageAsync() {
      throw new Error('unused');
    },
    async commitAsync() {
      calls.push('commit');
      current = state('committed');

      return current;
    },
    async resumePendingConfirmationAsync() {
      calls.push('resume-confirmation');

      return current;
    },
    async cancelAsync() {
      calls.push('cancel');
      current = state('cancelled', { updateExcluded: false });

      return current;
    },
    async interruptAsync() {
      current = state('interrupted', { updateExcluded: false });

      return current;
    },
    async cleanupAsync() {
      return current;
    }
  };

  return { api, calls };
}

test('hydrates restored native exclusion before workout creation is allowed', async () => {
  const latch = new UpdateExclusionLatch();
  const native = nativeFake(state('committed'));
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  assert.throws(() => latch.assertWorkoutCreationAllowed());
  await coordinator.hydrate();
  assert.throws(() => latch.assertWorkoutCreationAllowed());
  assert.deepEqual(native.calls, ['reconcile']);
});

test('update wins a same-runtime race by latching before durable claim', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  let observedBlockedWorkout = false;
  const native = nativeFake();
  const originalBegin = native.api.beginAttemptAsync;
  native.api.beginAttemptAsync = request => {
    observedBlockedWorkout = !latch.canCreateWorkout();

    return originalBegin(request);
  };

  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  assert.equal((await coordinator.begin(REQUEST)).status, 'started');
  assert.equal(observedBlockedWorkout, true);
  assert.equal(latch.canCreateWorkout(), false);
});

test('workout wins the opposite race and the durable attempt unwinds', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  const native = nativeFake();
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => true
  });

  assert.deepEqual(await coordinator.begin(REQUEST), {
    status: 'blocked',
    reason: 'active_workout'
  });
  assert.equal(latch.canCreateWorkout(), true);
  assert.deepEqual(native.calls, ['begin', 'cancel']);
});

test('dirty editors block updates while clean historical drafts do not', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  const editor = latch.registerEditor();
  const native = nativeFake();
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  editor.setDirty(true);
  assert.deepEqual(await coordinator.begin(REQUEST), {
    status: 'blocked',
    reason: 'transient_workout_edit'
  });
  editor.setDirty(false);
  assert.equal((await coordinator.begin(REQUEST)).status, 'started');
});

test('duplicate taps are blocked and cancellation restores controls', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  const native = nativeFake();
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  assert.equal((await coordinator.begin(REQUEST)).status, 'started');
  assert.deepEqual(await coordinator.begin(REQUEST), {
    status: 'blocked',
    reason: 'update_in_progress'
  });
  await coordinator.cancel(REQUEST.attemptId);
  assert.equal(latch.canCreateWorkout(), true);
});

test('commit rechecks active workout, permission, installed build and identity', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  const native = nativeFake();
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  await coordinator.begin(REQUEST);
  assert.equal(
    (await coordinator.commit(REQUEST.attemptId)).status,
    'committed'
  );
  assert.deepEqual(native.calls, [
    'begin',
    'permission',
    'installed',
    'state',
    'commit'
  ]);
  assert.equal(latch.canCreateWorkout(), false);
});

test('begin failure and terminal cancellation release exclusion', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  const native = nativeFake();
  native.api.beginAttemptAsync = async () => {
    throw new Error('native failure');
  };

  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  await assert.rejects(coordinator.begin(REQUEST), /native failure/);
  assert.equal(latch.canCreateWorkout(), true);
});

test('an active workout discovered before commit cancels and releases', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  let active = false;
  const native = nativeFake();
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => active
  });

  await coordinator.begin(REQUEST);
  active = true;
  assert.deepEqual(await coordinator.commit(REQUEST.attemptId), {
    status: 'blocked',
    reason: 'active_workout'
  });
  assert.equal(latch.canCreateWorkout(), true);
  assert.deepEqual(native.calls, ['begin', 'cancel']);
});

test('terminal commit failure reconciles and releases exclusion', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  const native = nativeFake();
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  await coordinator.begin(REQUEST);
  let commitFailed = false;
  native.api.commitAsync = async () => {
    commitFailed = true;

    throw new Error('install failed');
  };

  native.api.getStateAsync = async () =>
    commitFailed
      ? state('failed', { updateExcluded: false })
      : state('downloading');

  await assert.rejects(coordinator.commit(REQUEST.attemptId), /install failed/);
  assert.equal(latch.canCreateWorkout(), true);
});

test('failed cancellation keeps the native exclusion authoritative', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  const native = nativeFake();
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  await coordinator.begin(REQUEST);
  native.api.cancelAsync = async () => {
    throw new Error('cancel failed');
  };

  await assert.rejects(coordinator.cancel(REQUEST.attemptId), /cancel failed/);
  assert.equal(latch.canCreateWorkout(), false);
});

test('stale commit identity reconciles a released native exclusion', async () => {
  const latch = new UpdateExclusionLatch();
  latch.hydrate(false);
  const native = nativeFake();
  const coordinator = createUpdateExclusionCoordinator({
    latch,
    nativeUpdater: native.api,
    hasActiveWorkout: () => false
  });

  await coordinator.begin(REQUEST);
  native.api.getStateAsync = async () =>
    state('cancelled', {
      attemptId: null,
      updateExcluded: false
    });

  assert.deepEqual(await coordinator.commit(REQUEST.attemptId), {
    status: 'blocked',
    reason: 'stale_attempt'
  });
  assert.equal(latch.canCreateWorkout(), true);
});

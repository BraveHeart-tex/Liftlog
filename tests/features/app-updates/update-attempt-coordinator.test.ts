import {
  createUpdateAttemptCoordinator,
  type UpdateAttemptDependencies
} from '@/src/features/app-updates/update-attempt-coordinator';
import type { AvailableUpdate } from '@/src/features/app-updates/update.types';
import type { NativeUpdateState } from '@/modules/liftlog-updater/src/types';
import assert from 'node:assert/strict';
import test from 'node:test';

const release: AvailableUpdate = {
  releaseId: 68,
  versionName: '1.1.0',
  versionCode: 11,
  apkFilename: 'liftlog-1.1.0-arm64-v8a.apk',
  apkDownloadUrl: 'https://example.test/liftlog.apk',
  sha256: 'a'.repeat(64),
  sizeBytes: 100,
  releaseNotes: 'Safer updates.'
};

function nativeState(
  stage: NativeUpdateState['stage'],
  overrides: Partial<NativeUpdateState> = {}
): NativeUpdateState {
  return {
    attemptId: stage === 'idle' ? null : 'attempt-1',
    stage,
    targetVersionName: stage === 'idle' ? null : release.versionName,
    targetVersionCode: stage === 'idle' ? null : release.versionCode,
    fileUri: stage === 'idle' ? null : '/private/candidate.apk',
    sessionId: null,
    pendingConfirmation: false,
    updateExcluded: stage !== 'idle',
    resultCode: null,
    ...overrides
  };
}

function harness(overrides: Partial<UpdateAttemptDependencies> = {}) {
  const calls: string[] = [];
  let progress: ((written: number, expected: number) => void) | undefined;
  let resolveDownload: (() => void) | undefined;
  const dependencies: UpdateAttemptDependencies = {
    createAttemptId: () => 'attempt-1',
    begin: async () => {
      calls.push('begin');

      return { status: 'started', state: nativeState('downloading') };
    },
    permission: async () => {
      calls.push('permission');

      return { granted: true, settingsSupported: true };
    },
    openPermissionSettings: () => calls.push('settings'),
    download: (_url, _fileUri, onProgress) => {
      calls.push('download');
      progress = onProgress;

      return {
        promise: new Promise<void>(resolve => {
          resolveDownload = resolve;
        }),
        cancel: async () => {
          calls.push('cancel-download');
        }
      };
    },
    verify: async () => {
      calls.push('verify');
    },
    commit: async () => {
      calls.push('commit');

      return { status: 'committed', state: nativeState('committed') };
    },
    cancel: async () => {
      calls.push('cancel-native');

      return nativeState('cancelled', { updateExcluded: false });
    },
    interrupt: async () => {
      calls.push('interrupt-native');

      return nativeState('interrupted', { updateExcluded: false });
    },
    getState: async () => nativeState('idle'),
    reconcile: async () => nativeState('idle'),
    reportUnexpected: () => calls.push('report'),
    ...overrides
  };
  const coordinator = createUpdateAttemptCoordinator(dependencies);

  return {
    coordinator,
    calls,
    sendProgress: () => progress?.(40, 100),
    finishDownload: () => resolveDownload?.()
  };
}

test('runs permission, exact download, verification and commit after exclusion', async () => {
  const app = harness();
  const running = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.sendProgress();
  assert.deepEqual(app.coordinator.getState(), {
    status: 'downloading',
    attemptId: 'attempt-1',
    release,
    bytesDownloaded: 40,
    totalBytes: 100,
    progress: 0.4
  });
  app.finishDownload();
  await running;
  assert.deepEqual(app.calls, [
    'begin',
    'permission',
    'download',
    'verify',
    'commit'
  ]);
  assert.equal(app.coordinator.getState().status, 'installer');
});

test('permission handoff pauses before network and resumes explicitly', async () => {
  let granted = false;
  const app = harness({
    permission: async () => ({ granted, settingsSupported: true }),
    openPermissionSettings: () => app.calls.push('settings'),
    getState: async () => nativeState('downloading')
  });

  await app.coordinator.start(release);
  assert.equal(app.coordinator.getState().status, 'permission');
  assert.deepEqual(app.calls, ['begin', 'settings']);
  granted = true;
  const resumed = app.coordinator.resumePermission();
  await new Promise(resolve => setImmediate(resolve));
  app.finishDownload();
  await resumed;
  assert.equal(app.coordinator.getState().status, 'installer');
});

test('ordinary background interrupts download and ignores stale progress', async () => {
  const app = harness();
  const running = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  await app.coordinator.backgrounded();
  app.sendProgress();
  app.finishDownload();
  await running;
  assert.equal(app.coordinator.getState().status, 'interrupted');
  assert.deepEqual(app.calls, [
    'begin',
    'permission',
    'download',
    'cancel-download',
    'interrupt-native'
  ]);
});

test('cancel is unavailable after installer commit', async () => {
  const app = harness();
  const running = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.finishDownload();
  await running;
  await app.coordinator.cancel();
  assert.equal(app.calls.includes('cancel-native'), false);
});

test('reconciliation only reports success when native installation proves it', async () => {
  const app = harness({
    reconcile: async () => nativeState('succeeded', { updateExcluded: false })
  });
  await app.coordinator.reconcile();
  assert.equal(app.coordinator.getState().status, 'succeeded');
});

test('verification finishing in background waits for foreground before commit', async () => {
  let finishVerification!: () => void;
  const app = harness({
    verify: () =>
      new Promise<void>(resolve => {
        finishVerification = resolve;
      })
  });
  const running = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.finishDownload();
  await new Promise(resolve => setImmediate(resolve));
  await app.coordinator.backgrounded();
  finishVerification();
  await running;
  assert.equal(app.coordinator.getState().status, 'staging');
  assert.equal(app.calls.includes('commit'), false);
  await app.coordinator.foregrounded();
  assert.equal(app.coordinator.getState().status, 'installer');
});

test('retry after interruption starts a new download from zero', async () => {
  const app = harness();
  const first = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.sendProgress();
  await app.coordinator.backgrounded();
  app.finishDownload();
  await first;
  const retry = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.coordinator.getState().bytesDownloaded, 0);
  app.finishDownload();
  await retry;
});

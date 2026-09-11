import {
  createUpdateAttemptCoordinator,
  type UpdateAttemptDependencies
} from '@/src/features/app-updates/update-attempt-coordinator';
import type { AvailableUpdate } from '@/src/features/app-updates/update.types';
import type { NativeUpdateState } from '@/modules/liftlog-updater/src/types';
import { createAppUpdateReporter } from '@/src/features/app-updates/update-reporter';
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
  const beginRequests: Parameters<UpdateAttemptDependencies['begin']>[0][] = [];
  const reports: Parameters<
    UpdateAttemptDependencies['reportUnexpected']
  >[0][] = [];
  let progress: ((written: number, expected: number) => void) | undefined;
  let resolveDownload: (() => void) | undefined;
  const dependencies: UpdateAttemptDependencies = {
    createAttemptId: () => 'attempt-1',
    begin: async request => {
      calls.push('begin');
      beginRequests.push(request);

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
    resumeConfirmation: async () => {
      calls.push('resume-confirmation');

      return nativeState('pending_confirmation', {
        pendingConfirmation: true,
        sessionId: 42
      });
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
    reportUnexpected: failure => {
      calls.push('report');
      reports.push(failure);
    },
    ...overrides
  };
  const coordinator = createUpdateAttemptCoordinator(dependencies);

  return {
    coordinator,
    beginRequests,
    calls,
    reports,
    sendProgress: () => progress?.(40, 100),
    finishDownload: () => resolveDownload?.()
  };
}

test('reports a verification rejection with its original exception and safe attempt context', async () => {
  const source = Object.assign(new Error('APK signer does not match'), {
    code: 'UPDATER_CERTIFICATE_MISMATCH'
  });
  const app = harness({
    verify: async () => {
      throw source;
    }
  });

  const running = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.finishDownload();
  await running;

  assert.equal(app.coordinator.getState().status, 'failed');
  assert.deepEqual(app.reports, [
    {
      error: source,
      operation: 'start',
      stage: 'verification',
      errorCode: 'UPDATER_CERTIFICATE_MISMATCH',
      attemptId: 'attempt-1',
      targetVersionName: '1.1.0',
      targetVersionCode: 11,
      candidateSignerMatchesInstalled: false
    }
  ]);
});

test('captures the original exception with stable tags and safe native build extras', async () => {
  const source = Object.assign(
    new Error('staging failed', { cause: new Error('native cause') }),
    { code: 'UPDATER_STORAGE_FAILURE' }
  );
  const captures: { error: unknown; context: unknown }[] = [];
  const reporter = createAppUpdateReporter({
    captureException: (error, context) => {
      captures.push({ error, context });

      return 'event-1';
    },
    captureMessage: () => 'event-1',
    getInstalledBuildInfo: async () => ({
      packageName: 'com.liftlog',
      versionName: '1.0.4',
      versionCode: 5,
      certificateSha256: 'secret-certificate-hash',
      isDebuggable: true
    }),
    androidApiLevel: 35,
    consoleError: () => undefined
  });
  const app = harness({
    verify: async () => {
      throw source;
    },
    reportUnexpected: reporter.reportUnexpected
  });

  const running = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.finishDownload();
  await running;
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(captures[0]?.error, source);
  assert.deepEqual(captures[0]?.context, {
    level: 'error',
    tags: {
      feature: 'app_updates',
      operation: 'start',
      stage: 'verification',
      updater_error_code: 'UPDATER_STORAGE_FAILURE'
    },
    extra: {
      attemptId: 'attempt-1',
      installedVersionName: '1.0.4',
      installedVersionCode: 5,
      targetVersionName: '1.1.0',
      targetVersionCode: 11,
      androidApiLevel: 35,
      isDebuggable: true,
      candidateSignerMatchesInstalled: null
    }
  });
  assert.doesNotMatch(
    JSON.stringify(captures),
    /packageName|certificate|secret/i
  );
});

test('captures startup and foreground reconciliation exceptions with safe native context', async () => {
  const source = new Error('reconciliation failed');
  const captures: { error: unknown; context: unknown }[] = [];
  const reporter = createAppUpdateReporter({
    captureException: (error, context) => {
      captures.push({ error, context });

      return 'event-1';
    },
    captureMessage: () => 'event-1',
    getInstalledBuildInfo: async () => ({
      packageName: 'com.liftlog',
      versionName: '1.0.4',
      versionCode: 5,
      certificateSha256: 'secret-certificate-hash',
      isDebuggable: false
    }),
    getNativeState: async () =>
      nativeState('committed', {
        attemptId: 'attempt-legacy',
        targetVersionName: '1.1.0',
        targetVersionCode: 11
      }),
    androidApiLevel: 35,
    consoleError: () => undefined
  });

  reporter.reportReconciliationFailure(source, 'startup_reconcile');
  reporter.reportReconciliationFailure(source, 'foreground_reconcile');
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(captures.length, 2);
  assert.equal(
    captures.every(capture => capture.error === source),
    true
  );
  assert.deepEqual(
    captures.map(capture => capture.context),
    ['startup_reconcile', 'foreground_reconcile'].map(operation => ({
      level: 'error',
      tags: {
        feature: 'app_updates',
        operation,
        stage: 'reconcile',
        updater_error_code: 'UPDATE_RECONCILIATION_FAILED'
      },
      extra: {
        attemptId: 'attempt-legacy',
        installedVersionName: '1.0.4',
        installedVersionCode: 5,
        targetVersionName: '1.1.0',
        targetVersionCode: 11,
        nativeStage: 'committed',
        androidApiLevel: 35,
        isDebuggable: false
      }
    }))
  );
  assert.doesNotMatch(
    JSON.stringify(captures),
    /packageName|certificate|secret/i
  );
});

test('uses a safe message fallback when enrichment and a non-Error rejection fail', async () => {
  const messages: { message: string; context: unknown }[] = [];
  const consoleErrors: unknown[] = [];
  const reporter = createAppUpdateReporter({
    captureException: () => {
      throw new Error('captureException should not be used');
    },
    captureMessage: (message, context) => {
      messages.push({ message, context });

      return 'event-1';
    },
    getInstalledBuildInfo: async () => {
      throw new Error('native metadata unavailable');
    },
    androidApiLevel: 31,
    consoleError: (_message, error) => consoleErrors.push(error)
  });
  const app = harness({
    begin: async () => {
      throw { code: 'UPDATER_TOKEN_SECRET' };
    },
    reportUnexpected: reporter.reportUnexpected
  });

  await app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(app.coordinator.getState().errorCode, 'UPDATE_UNEXPECTED');
  assert.deepEqual(messages, [
    {
      message: 'UPDATE_ATTEMPT_FAILED',
      context: {
        level: 'error',
        tags: {
          feature: 'app_updates',
          operation: 'start',
          stage: 'begin',
          updater_error_code: 'UPDATE_UNEXPECTED'
        },
        extra: {
          attemptId: 'attempt-1',
          targetVersionName: '1.1.0',
          targetVersionCode: 11,
          androidApiLevel: 31,
          candidateSignerMatchesInstalled: null
        }
      }
    }
  ]);
  assert.equal(consoleErrors.length, 1);
  assert.doesNotMatch(JSON.stringify(messages), /unsafe|token|secret/i);
});

test('reports commit rejection after successful signer comparison', async () => {
  const source = Object.assign(new Error('commit failed'), {
    code: 'UPDATER_INSTALL_FAILED'
  });
  const app = harness({
    commit: async () => {
      throw source;
    }
  });

  const running = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.finishDownload();
  await running;

  assert.deepEqual(app.reports, [
    {
      error: source,
      operation: 'start',
      stage: 'commit',
      errorCode: 'UPDATER_INSTALL_FAILED',
      attemptId: 'attempt-1',
      targetVersionName: '1.1.0',
      targetVersionCode: 11,
      candidateSignerMatchesInstalled: true
    }
  ]);
});

test('capture failure stays fail-open and does not prevent another attempt', async () => {
  let verificationCount = 0;
  const consoleErrors: unknown[] = [];
  const reporter = createAppUpdateReporter({
    captureException: () => {
      throw new Error('Sentry unavailable');
    },
    captureMessage: () => {
      throw new Error('Sentry unavailable');
    },
    getInstalledBuildInfo: async () => ({
      packageName: 'com.liftlog',
      versionName: '1.0.4',
      versionCode: 5,
      certificateSha256: 'certificate',
      isDebuggable: false
    }),
    androidApiLevel: 35,
    consoleError: (_message, error) => consoleErrors.push(error)
  });
  const app = harness({
    verify: async () => {
      verificationCount += 1;

      if (verificationCount === 1) {
        throw new Error('first attempt failed');
      }
    },
    reportUnexpected: reporter.reportUnexpected
  });

  const first = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.finishDownload();
  await first;
  await new Promise(resolve => setImmediate(resolve));
  const retry = app.coordinator.start(release);
  await new Promise(resolve => setImmediate(resolve));
  app.finishDownload();
  await retry;

  assert.equal(app.coordinator.getState().status, 'installer');
  assert.equal(consoleErrors.length, 1);
  assert.equal(app.calls.filter(call => call === 'begin').length, 2);
});

test('keeps exception grouping stack-based and non-Error fallback grouping stable', async () => {
  const exceptions: { error: unknown; context: object }[] = [];
  const messages: { message: string; context: object }[] = [];
  const failures: unknown[] = [
    new Error('first real failure'),
    new Error('second real failure'),
    'file:///private/candidate.apk',
    { token: 'secret' }
  ];
  const reporter = createAppUpdateReporter({
    captureException: (error, context) => {
      exceptions.push({ error, context });

      return 'event';
    },
    captureMessage: (message, context) => {
      messages.push({ message, context });

      return 'event';
    },
    getInstalledBuildInfo: async () => ({
      packageName: 'com.liftlog',
      versionName: '1.0.4',
      versionCode: 5,
      certificateSha256: 'certificate',
      isDebuggable: false
    }),
    androidApiLevel: 35,
    consoleError: () => undefined
  });
  const app = harness({
    verify: async () => {
      throw failures.shift();
    },
    reportUnexpected: reporter.reportUnexpected
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const running = app.coordinator.start(release);
    await new Promise(resolve => setImmediate(resolve));
    app.finishDownload();
    await running;
  }

  await new Promise(resolve => setImmediate(resolve));

  assert.equal(exceptions.length, 2);
  assert.equal(
    exceptions.every(capture => !('fingerprint' in capture.context)),
    true
  );
  assert.deepEqual(
    messages.map(capture => capture.message),
    ['UPDATE_ATTEMPT_FAILED', 'UPDATE_ATTEMPT_FAILED']
  );
  assert.equal(
    messages.every(capture => !('fingerprint' in capture.context)),
    true
  );
});

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
  assert.deepEqual(app.reports, []);
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

test('reports native permission-resume preflight rejection', async () => {
  const source = Object.assign(new Error('native state unavailable'), {
    code: 'UPDATER_CONTEXT_UNAVAILABLE'
  });
  const app = harness({
    permission: async () => ({ granted: false, settingsSupported: true }),
    getState: async () => {
      throw source;
    }
  });

  await app.coordinator.start(release);
  await app.coordinator.resumePermission();

  assert.deepEqual(app.reports, [
    {
      error: source,
      operation: 'resume_permission',
      stage: 'permission',
      errorCode: 'UPDATER_CONTEXT_UNAVAILABLE',
      attemptId: 'attempt-1',
      targetVersionName: '1.1.0',
      targetVersionCode: 11,
      candidateSignerMatchesInstalled: null
    }
  ]);
  assert.equal(app.coordinator.getState().status, 'failed');
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
  assert.deepEqual(app.reports, []);
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
  assert.deepEqual(app.reports, []);
});

test('pending installer confirmation is reopened explicitly', async () => {
  const app = harness({
    reconcile: async () =>
      nativeState('pending_confirmation', {
        pendingConfirmation: true,
        sessionId: 42
      })
  });

  await app.coordinator.reconcile();
  assert.equal(app.coordinator.getState().status, 'installer');
  await app.coordinator.resumeConfirmation();
  assert.equal(app.coordinator.getState().status, 'installer');
  assert.equal(
    app.calls.filter(call => call === 'resume-confirmation').length,
    1
  );
});

test('confirmation recovery failures stay retryable and rapid calls coalesce', async () => {
  let rejectResume!: (error: Error) => void;
  const app = harness({
    reconcile: async () =>
      nativeState('pending_confirmation', {
        pendingConfirmation: true,
        sessionId: 42
      }),
    resumeConfirmation: () => {
      app.calls.push('resume-confirmation');

      return new Promise<NativeUpdateState>((_resolve, reject) => {
        rejectResume = reject;
      });
    }
  });

  await app.coordinator.reconcile();
  const first = app.coordinator.resumeConfirmation();
  const second = app.coordinator.resumeConfirmation();
  rejectResume(
    Object.assign(new Error('No installer details activity'), {
      code: 'UPDATER_CONFIRMATION_UNAVAILABLE'
    })
  );
  await Promise.all([first, second]);

  assert.equal(
    app.calls.filter(call => call === 'resume-confirmation').length,
    1
  );
  assert.equal(app.coordinator.getState().status, 'installer');
  assert.equal(
    app.coordinator.getState().errorCode,
    'UPDATER_CONFIRMATION_UNAVAILABLE'
  );
});

test('reconciliation only reports success when native installation proves it', async () => {
  const app = harness({
    reconcile: async () => nativeState('succeeded', { updateExcluded: false })
  });
  await app.coordinator.reconcile();
  assert.equal(app.coordinator.getState().status, 'succeeded');
  assert.equal(app.coordinator.getState().targetVersionCode, 11);
  assert.deepEqual(app.reports, []);
});

test('a newer release can start after a previous update reconciles successfully', async () => {
  const nextRelease: AvailableUpdate = {
    ...release,
    releaseId: 69,
    versionName: '1.2.0',
    versionCode: 12,
    apkFilename: 'liftlog-1.2.0-arm64-v8a.apk'
  };
  const app = harness({
    reconcile: async () => nativeState('succeeded', { updateExcluded: false })
  });

  await app.coordinator.reconcile();
  const running = app.coordinator.start(nextRelease);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(app.beginRequests.length, 1);
  assert.equal(app.beginRequests[0]?.targetVersionCode, 12);
  assert.equal(app.coordinator.getState().status, 'downloading');

  app.finishDownload();
  await running;
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

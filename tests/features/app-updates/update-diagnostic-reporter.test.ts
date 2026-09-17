import type {
  PendingUpdateDiagnostics,
  UpdateDiagnostic
} from '@/modules/liftlog-updater/src/types';
import { createUpdateDiagnosticReporter } from '@/src/features/app-updates/update-diagnostic-reporter';
import assert from 'node:assert/strict';
import test from 'node:test';

const diagnostic: UpdateDiagnostic = {
  kind: 'failure',
  diagnosticId: 'diagnostic-1',
  attemptId: 'attempt-1',
  occurredAt: 1_700_000_000_000,
  source: 'android_installer_callback',
  nativeStage: 'committed',
  resultCode: 'UPDATER_INSTALL_BLOCKED',
  targetVersionName: '1.1.0',
  targetVersionCode: 11,
  rawStatus: -2,
  statusMessage: 'Blocked by file:///data/private.apk token=secret',
  blockingPackage: 'com.android.vending',
  storageLocation: 'external'
};

test('submits sanitized native lifecycle outcomes as informational diagnostics', async () => {
  const app = harness({
    getPendingDiagnostics: async () =>
      pending([
        {
          ...diagnostic,
          kind: 'outcome',
          source: 'android_package_replaced',
          nativeStage: 'succeeded',
          resultCode: 'UPDATER_COMPLETION_NOTIFICATION_POSTED',
          rawStatus: null,
          statusMessage: null,
          blockingPackage: null,
          storageLocation: null
        }
      ])
  });

  await app.reporter.drainOne();

  assert.equal(app.captures[0]?.message, 'UPDATE_INSTALL_OUTCOME');
  assert.deepEqual(
    (app.captures[0]?.context as { level: string }).level,
    'info'
  );
  assert.deepEqual(app.acknowledgements, [['attempt-1', 'diagnostic-1']]);
});

function pending(
  diagnostics: UpdateDiagnostic[] = [diagnostic]
): PendingUpdateDiagnostics {
  return { diagnostics, droppedDiagnosticCount: 2 };
}

function harness(overrides: Record<string, unknown> = {}) {
  const captures: { message: string; context: unknown }[] = [];
  const acknowledgements: [string, string][] = [];
  const errors: unknown[] = [];
  const reporter = createUpdateDiagnosticReporter({
    getPendingDiagnostics: async () => pending(),
    acknowledge: async (attemptId: string, diagnosticId: string) => {
      acknowledgements.push([attemptId, diagnosticId]);

      return true;
    },
    captureMessage: (message: string, context: unknown) => {
      captures.push({ message, context });

      return 'event-1';
    },
    getInstalledBuildInfo: async () => ({
      packageName: 'com.liftlog',
      versionName: '1.0.4',
      versionCode: 5,
      certificateSha256: 'must-not-be-sent',
      isDebuggable: false
    }),
    androidApiLevel: 35,
    now: () => 1_700_000_005_000,
    consoleError: (_message: string, error: unknown) => errors.push(error),
    ...overrides
  });

  return { reporter, captures, acknowledgements, errors };
}

test('submits the oldest native diagnostic and acknowledges its exact identity', async () => {
  const app = harness({
    getPendingDiagnostics: async () =>
      pending([
        diagnostic,
        { ...diagnostic, diagnosticId: 'diagnostic-2', attemptId: 'attempt-2' }
      ])
  });

  await app.reporter.drainOne();

  assert.deepEqual(app.acknowledgements, [['attempt-1', 'diagnostic-1']]);
  assert.deepEqual(app.captures, [
    {
      message: 'UPDATE_INSTALL_FAILED',
      context: {
        level: 'error',
        fingerprint: [
          'UPDATE_INSTALL_FAILED',
          'UPDATER_INSTALL_BLOCKED',
          'committed',
          '-2'
        ],
        tags: {
          feature: 'app_updates',
          operation: 'android_installer_callback',
          stage: 'committed',
          updater_error_code: 'UPDATER_INSTALL_BLOCKED'
        },
        extra: {
          attemptId: 'attempt-1',
          diagnosticId: 'diagnostic-1',
          occurredAt: 1_700_000_000_000,
          diagnosticAgeMillis: 5_000,
          droppedDiagnosticCount: 2,
          installedVersionName: '1.0.4',
          installedVersionCode: 5,
          targetVersionName: '1.1.0',
          targetVersionCode: 11,
          androidApiLevel: 35,
          isDebuggable: false,
          rawInstallerStatus: -2,
          installerStatusMessage: 'Blocked by [redacted] [redacted]',
          blockingPackage: 'com.android.vending',
          storageLocation: 'external'
        }
      }
    }
  ]);
  assert.doesNotMatch(
    JSON.stringify(app.captures),
    /certificate|must-not-be-sent/i
  );
});

test('capture failure or missing local event ID retains the diagnostic for retry', async () => {
  let captures = 0;
  const app = harness({
    captureMessage: () => {
      captures += 1;

      if (captures === 1) {
        throw new Error('Sentry unavailable');
      }

      return captures === 2 ? undefined : 'event-3';
    }
  });

  await app.reporter.drainOne();
  assert.deepEqual(app.acknowledgements, []);
  await app.reporter.drainOne();
  assert.deepEqual(app.acknowledgements, []);
  await app.reporter.drainOne();
  assert.deepEqual(app.acknowledgements, [['attempt-1', 'diagnostic-1']]);
  assert.equal(app.errors.length, 1);
});

test('reporting and acknowledgement failures stay fail-open and one-at-a-time', async () => {
  let releaseRead!: () => void;
  let readCalls = 0;
  const app = harness({
    getPendingDiagnostics: () => {
      readCalls += 1;

      return new Promise<PendingUpdateDiagnostics>(resolve => {
        releaseRead = () => resolve(pending());
      });
    },
    acknowledge: async () => {
      throw new Error('native acknowledgement unavailable');
    }
  });

  const first = app.reporter.drainOne();
  const concurrent = app.reporter.drainOne();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(readCalls, 1);
  releaseRead();
  await Promise.all([first, concurrent]);
  assert.equal(app.errors.length, 1);
});

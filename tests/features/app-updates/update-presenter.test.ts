import {
  presentUpdateAttempt,
  presentUpdateState
} from '@/src/features/app-updates/update-presenter';
import assert from 'node:assert/strict';
import test from 'node:test';

test('presents no-update and actionable failure messages', () => {
  assert.equal(
    presentUpdateState({ status: 'checking', installedVersion: '1.0.3' })
      .message,
    'Checking for updates...'
  );
  assert.equal(
    presentUpdateState({ status: 'up_to_date', installedVersion: '1.0.3' })
      .message,
    'LiftLog is up to date.'
  );
  assert.match(
    presentUpdateState({
      status: 'error',
      installedVersion: '1.0.3',
      error: { code: 'rate_limited' }
    }).message ?? '',
    /GitHub rate limit/
  );
  assert.match(
    presentUpdateState({
      status: 'error',
      installedVersion: '1.0.3',
      error: { code: 'offline' }
    }).message ?? '',
    /connection/
  );
});

test('presents truthful attempt status and one recovery action', () => {
  assert.deepEqual(
    presentUpdateAttempt({
      status: 'downloading',
      bytesDownloaded: 24_641_536,
      totalBytes: 58_720_256,
      progress: 0.42
    }),
    {
      message: 'Downloading update - 42% (23.5 MB of 56 MB)',
      action: 'cancel'
    }
  );
  assert.deepEqual(presentUpdateAttempt({ status: 'verifying' }), {
    message: 'Verifying update...',
    action: 'cancel'
  });
  assert.deepEqual(presentUpdateAttempt({ status: 'installer' }), {
    message: 'Continue in Android to install the update.',
    action: undefined
  });
  assert.deepEqual(
    presentUpdateAttempt({
      status: 'failed',
      blockReason: 'active_workout'
    }),
    {
      message: 'Finish or discard your active workout before updating.',
      action: 'retry'
    }
  );
});

test('presents recovery guidance for actionable native failures', () => {
  const cases = [
    [
      'UPDATER_INCOMPATIBLE_APK',
      'This update is not compatible with your device. Download a compatible APK.'
    ],
    [
      'UPDATER_INSTALL_CONFLICT',
      'The update conflicts with the installed app. Install it from the same source as your current app.'
    ],
    [
      'UPDATER_INVALID_APK',
      'Android rejected the update file. Download the update again.'
    ],
    [
      'UPDATER_INSTALL_TIMEOUT',
      'Android did not confirm the installation in time. Try again.'
    ],
    [
      'UPDATER_CONFIRMATION_UNAVAILABLE',
      'Could not confirm whether the update installed. Restart LiftLog and check again.'
    ],
    [
      'UPDATER_ABI_MISMATCH',
      "This update does not support your device's processor. Download a compatible APK."
    ],
    [
      'UPDATER_FILE_CHANGED',
      'The update file changed before installation. Download it again.'
    ]
  ] as const;

  for (const [errorCode, message] of cases) {
    assert.deepEqual(
      presentUpdateAttempt({ status: 'failed', errorCode }),
      { message, action: 'retry' },
      errorCode
    );
  }
});

test('keeps internal failures generic and expected outcomes unchanged', () => {
  for (const errorCode of [
    'UPDATER_SESSION_MISSING',
    'UPDATER_INVALID_STAGE',
    'UPDATER_STATE_WRITE_FAILED',
    'UPDATER_CONFIRMATION_MISSING',
    'UPDATER_INSTALL_FAILED',
    'UPDATE_UNEXPECTED',
    'UPDATER_UNKNOWN',
    undefined
  ]) {
    assert.deepEqual(
      presentUpdateAttempt({ status: 'failed', errorCode }),
      {
        message: 'Could not install the update. Try again.',
        action: 'retry'
      },
      errorCode
    );
  }

  assert.deepEqual(presentUpdateAttempt({ status: 'cancelled' }), {
    message: 'Update cancelled.',
    action: 'retry'
  });
  assert.deepEqual(presentUpdateAttempt({ status: 'interrupted' }), {
    message: 'Update interrupted. Retry starts from the beginning.',
    action: 'retry'
  });
});

test('caps remote notes and formats the APK size in MB', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: {
      releaseId: 65,
      versionName: '1.1.0',
      versionCode: 5,
      apkFilename: 'liftlog-1.1.0-arm64-v8a.apk',
      apkDownloadUrl: 'url',
      sha256: 'a'.repeat(64),
      sizeBytes: 58_720_256,
      releaseNotes: 'x'.repeat(5_000)
    }
  });

  assert.equal(presentation.availableVersion, '1.1.0');
  assert.equal(presentation.size, '56 MB');
  assert.equal(presentation.releaseNotes?.length, 4_001);
  assert.ok(presentation.releaseNotes?.endsWith('\u2026'));
});

test('hides generated compare-only release notes', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: {
      releaseId: 65,
      versionName: '1.1.0',
      versionCode: 5,
      apkFilename: 'liftlog-1.1.0-arm64-v8a.apk',
      apkDownloadUrl: 'url',
      sha256: 'a'.repeat(64),
      sizeBytes: 58_720_256,
      releaseNotes:
        "## What's Changed\n\n**Full Changelog**: https://github.com/example/liftlog/compare/v1.0.3...v1.1.0"
    }
  });

  assert.equal(presentation.releaseNotes, undefined);
});

test('keeps authored notes while removing the generated changelog footer', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: {
      releaseId: 65,
      versionName: '1.1.0',
      versionCode: 5,
      apkFilename: 'liftlog-1.1.0-arm64-v8a.apk',
      apkDownloadUrl: 'url',
      sha256: 'a'.repeat(64),
      sizeBytes: 58_720_256,
      releaseNotes:
        'Faster startup.\n\n**Full Changelog**: https://github.com/example/liftlog/compare/v1.0.3...v1.1.0'
    }
  });

  assert.equal(presentation.releaseNotes, 'Faster startup.');
});

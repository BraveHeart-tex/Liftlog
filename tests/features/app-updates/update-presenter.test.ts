import {
  presentUpdateAttempt,
  presentUpdateState
} from '@/src/features/app-updates/update-presenter';
import type { AvailableUpdate } from '@/src/features/app-updates/update.types';
import type { UpdateAttemptState } from '@/src/features/app-updates/update-attempt-coordinator';

const availableRelease: AvailableUpdate = {
  releaseId: 65,
  versionName: '1.1.0',
  versionCode: 5,
  apkFilename: 'liftlog-1.1.0-arm64-v8a.apk',
  apkDownloadUrl: 'url',
  sha256: 'a'.repeat(64),
  sizeBytes: 58_720_256,
  releaseNotes: 'Faster startup.'
};

const shown = expect.any(String);
const hidden = undefined;

type AttemptCase = [
  name: string,
  state: UpdateAttemptState,
  release: AvailableUpdate | undefined,
  expected: { action: string | undefined; message: unknown }
];

const attemptCases: AttemptCase[] = [
  [
    'idle with a release',
    { status: 'idle' },
    availableRelease,
    { action: 'update', message: hidden }
  ],
  [
    'idle without a release',
    { status: 'idle' },
    undefined,
    { action: undefined, message: hidden }
  ],
  [
    'downloading',
    { status: 'downloading', bytesDownloaded: 1, totalBytes: 2, progress: 0.5 },
    undefined,
    { action: 'cancel', message: shown }
  ],
  [
    'verifying',
    { status: 'verifying' },
    undefined,
    { action: 'cancel', message: shown }
  ],
  [
    'staging',
    { status: 'staging' },
    undefined,
    { action: 'cancel', message: shown }
  ],
  [
    'installer',
    { status: 'installer' },
    undefined,
    { action: undefined, message: shown }
  ],
  [
    'installer pending confirmation',
    {
      status: 'installer',
      pendingConfirmation: true,
      errorCode: 'UPDATER_CONFIRMATION_UNAVAILABLE'
    },
    undefined,
    { action: 'installer', message: shown }
  ],
  [
    'permission',
    { status: 'permission' },
    undefined,
    { action: 'permission', message: shown }
  ],
  [
    'active attempt with a newer release',
    {
      status: 'downloading',
      release: { ...availableRelease, versionCode: 4 },
      bytesDownloaded: 20,
      totalBytes: 100,
      progress: 0.2
    },
    availableRelease,
    { action: 'cancel', message: shown }
  ],
  [
    'failed for the release',
    { status: 'failed', release: availableRelease },
    availableRelease,
    { action: 'retry', message: shown }
  ],
  [
    'blocked by an active workout',
    {
      status: 'failed',
      blockReason: 'active_workout',
      release: availableRelease
    },
    availableRelease,
    { action: 'retry', message: shown }
  ],
  [
    'cancelled for the release',
    { status: 'cancelled', release: availableRelease },
    availableRelease,
    { action: 'retry', message: shown }
  ],
  [
    'interrupted for the release',
    { status: 'interrupted', release: availableRelease },
    availableRelease,
    { action: 'retry', message: shown }
  ],
  [
    'succeeded without a release',
    { status: 'succeeded' },
    undefined,
    { action: undefined, message: shown }
  ],
  [
    'failed without a release',
    { status: 'failed' },
    undefined,
    { action: undefined, message: shown }
  ],
  [
    'cancelled without a release',
    { status: 'cancelled' },
    undefined,
    { action: undefined, message: shown }
  ],
  [
    'interrupted without a release',
    { status: 'interrupted' },
    undefined,
    { action: undefined, message: shown }
  ],
  [
    'succeeded when another release is available',
    { status: 'succeeded' },
    availableRelease,
    { action: 'update', message: hidden }
  ],
  ...(['succeeded', 'failed', 'cancelled', 'interrupted'] as const).map(
    status =>
      [
        `stale ${status} when another release is available`,
        { status, targetVersionCode: 4 },
        availableRelease,
        { action: 'update', message: hidden }
      ] satisfies AttemptCase
  )
];

test.each(attemptCases)(
  'update attempt %s presents its action and status',
  (_name, state, release, expected) => {
    const presentation = presentUpdateAttempt(state, release);

    expect(presentation.action).toBe(expected.action);
    expect(presentation.message).toEqual(expected.message);
  }
);

test.each([
  ['checking', { status: 'checking', installedVersion: '1.0.3' }, shown],
  ['up to date', { status: 'up_to_date', installedVersion: '1.0.3' }, shown],
  ...(
    ['offline', 'rate_limited', 'malformed_release', 'check_failed'] as const
  ).map(
    code =>
      [
        `error ${code}`,
        { status: 'error', installedVersion: '1.0.3', error: { code } },
        shown
      ] as const
  ),
  [
    'available',
    {
      status: 'available',
      installedVersion: '1.0.3',
      release: availableRelease
    },
    hidden
  ]
] as const)('update state %s presents its status', (_name, state, message) => {
  expect(presentUpdateState(state).message).toEqual(message);
});

function failedMessage(errorCode?: string) {
  return presentUpdateAttempt(
    { status: 'failed', errorCode, release: availableRelease },
    availableRelease
  ).message;
}

test('actionable native failures get specific recovery guidance', () => {
  const genericMessage = failedMessage();

  for (const errorCode of [
    'UPDATER_INCOMPATIBLE_APK',
    'UPDATER_INSTALL_CONFLICT',
    'UPDATER_INVALID_APK',
    'UPDATER_INSTALL_TIMEOUT',
    'UPDATER_CONFIRMATION_UNAVAILABLE',
    'UPDATER_ABI_MISMATCH',
    'UPDATER_FILE_CHANGED'
  ]) {
    expect({ errorCode, message: failedMessage(errorCode) }).not.toEqual({
      errorCode,
      message: genericMessage
    });
  }
});

test('internal native failures stay generic', () => {
  const genericMessage = failedMessage();

  for (const errorCode of [
    'UPDATER_SESSION_MISSING',
    'UPDATER_INVALID_STAGE',
    'UPDATER_STATE_WRITE_FAILED',
    'UPDATER_CONFIRMATION_MISSING',
    'UPDATER_INSTALL_FAILED',
    'UPDATE_UNEXPECTED',
    'UPDATER_UNKNOWN'
  ]) {
    expect({ errorCode, message: failedMessage(errorCode) }).toEqual({
      errorCode,
      message: genericMessage
    });
  }
});

test('download status reports progress and sizes in MB', () => {
  const { message } = presentUpdateAttempt({
    status: 'downloading',
    release: availableRelease,
    bytesDownloaded: 24_641_536,
    totalBytes: 58_720_256,
    progress: 0.42
  });

  expect(message).toContain('42%');
  expect(message).toContain('23.5 MB of 56 MB');
});

test('caps remote notes and formats the APK size in MB', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: { ...availableRelease, releaseNotes: 'x'.repeat(5_000) }
  });

  expect(presentation.availableVersion).toBe('1.1.0');
  expect(presentation.size).toBe('56 MB');
  expect(presentation.releaseNotes).toHaveLength(4_001);
  expect(presentation.releaseNotes?.endsWith('…')).toBe(true);
});

test('hides generated compare-only release notes', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: {
      ...availableRelease,
      releaseNotes:
        "## What's Changed\n\n**Full Changelog**: https://github.com/example/liftlog/compare/v1.0.3...v1.1.0"
    }
  });

  expect(presentation.releaseNotes).toBeUndefined();
});

test('keeps authored notes while removing the generated changelog footer', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: {
      ...availableRelease,
      releaseNotes:
        'Faster startup.\n\n**Full Changelog**: https://github.com/example/liftlog/compare/v1.0.3...v1.1.0'
    }
  });

  expect(presentation.releaseNotes).toBe('Faster startup.');
});

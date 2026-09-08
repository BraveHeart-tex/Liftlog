import {
  createAutomaticUpdateScheduler,
  isUpdateAnnouncementEligible,
  shouldShowUpdateAnnouncement,
  UPDATE_DETAILS_ROUTE
} from '@/src/features/app-updates/update-announcement';
import type { UpdateState } from '@/src/features/app-updates/update.types';
import assert from 'node:assert/strict';
import test from 'node:test';

const availableState: UpdateState = {
  status: 'available',
  installedVersion: '1.0.3',
  release: {
    releaseId: 69,
    versionName: '1.1.0',
    versionCode: 5,
    apkFilename: 'liftlog.apk',
    apkDownloadUrl: 'https://example.invalid/liftlog.apk',
    sha256: 'a'.repeat(64),
    sizeBytes: 12_345,
    releaseNotes: 'Faster logging'
  }
};

test('announcement eligibility is version-specific and keeps availability intact', () => {
  assert.equal(isUpdateAnnouncementEligible(availableState), true);
  assert.equal(
    isUpdateAnnouncementEligible({
      ...availableState,
      dismissedVersionCode: 5
    }),
    false
  );
  assert.equal(
    isUpdateAnnouncementEligible({
      ...availableState,
      dismissedVersionCode: 4
    }),
    true
  );
});

test('banner visibility excludes update surfaces and targets the details route', () => {
  assert.equal(shouldShowUpdateAnnouncement(availableState, '/'), true);
  assert.equal(
    shouldShowUpdateAnnouncement(availableState, '/update-details'),
    false
  );
  assert.equal(
    shouldShowUpdateAnnouncement(availableState, '/settings'),
    false
  );

  assert.equal(UPDATE_DETAILS_ROUTE, '/update-details');
});

test('automatic scheduler waits for idle after startup and each foreground event', async () => {
  const scheduled: (() => void)[] = [];
  let cancellations = 0;
  let checks = 0;
  const scheduler = createAutomaticUpdateScheduler({
    schedule: callback => {
      scheduled.push(callback);

      return () => {
        cancellations += 1;
      };
    },
    check: async () => {
      checks += 1;
    }
  });

  scheduler.started();
  assert.equal(checks, 0);
  assert.equal(scheduled.length, 1);
  scheduled[0]();
  await Promise.resolve();
  assert.equal(checks, 1);

  scheduler.foregrounded();
  scheduler.foregrounded();
  assert.equal(scheduled.length, 3);
  assert.equal(cancellations, 1);
  scheduled[2]();
  await Promise.resolve();
  assert.equal(checks, 2);

  scheduler.dispose();
});

test('automatic scheduler contains rejected checks', async () => {
  let scheduled!: () => void;
  const scheduler = createAutomaticUpdateScheduler({
    schedule: callback => {
      scheduled = callback;

      return () => undefined;
    },
    check: async () => {
      throw new Error('offline');
    }
  });

  scheduler.started();
  scheduled();
  await Promise.resolve();
  await Promise.resolve();
  scheduler.dispose();
});

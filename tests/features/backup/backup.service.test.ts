import { exercises } from '@/src/db/schema';
import type { DrizzleDb } from '@/src/db/client';
import type { LiftLogBackupV2 } from '@/src/features/backup/backup.types';
import type { ReplaceBackupOptions } from '@/src/features/backup/backup.service';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';
import { createBackup, seedTrackedExercise } from '@/tests/support/factories';

// jest-expo loads no native File/Paths for expo-file-system, so Paths is undefined.
jest.doMock('expo-file-system', () => ({
  File: class {},
  Paths: { cache: { uri: 'cache:' }, document: { uri: 'document:' } }
}));

const servicePromise = import('@/src/features/backup/backup.service');

afterEach(closeTestDatabases);

const importedExercise = {
  id: 'exercise-imported',
  name: 'Imported lift',
  normalizedName: 'imported lift',
  equipment: null,
  trackingType: 'reps' as const,
  primaryMuscles: null,
  secondaryMuscles: null,
  isCustom: 1,
  isArchived: 0,
  createdAt: 1
};

/** Which data the database holds at the moment a port runs. */
function dataState(db: DrizzleDb) {
  const ids = db
    .select({ id: exercises.id })
    .from(exercises)
    .all()
    .map(row => row.id);

  return ids.includes(importedExercise.id) ? 'imported' : 'local';
}

function harness(db: DrizzleDb) {
  const events: string[] = [];
  const files = new Map<string, string>();
  const record = (event: string) => {
    events.push(`${event}:${dataState(db)}`);
  };

  const options: ReplaceBackupOptions = {
    now: new Date('2026-09-05T12:00:00.000Z'),
    themePreference: 'system',
    filePort: {
      write: async (uri: string, contents: string) => {
        files.set(uri, contents);
        record('write-safety-backup');
      },
      promote: async () => record('promote-safety-backup'),
      remove: async () => record('remove-temporary-file'),
      read: async () => '',
      share: async () => undefined
    },
    cancelTimer: () => record('cancel-timer'),
    cancelNotification: async () => record('cancel-notification'),
    setTheme: () => record('set-theme'),
    refreshLiveQueries: () => record('refresh')
  };

  return { events, files, options };
}

test('replace-all writes the Safety backup first and cancels the timer before its notification', async () => {
  const { replaceAllWithBackup } = await servicePromise;
  const { db } = await createMigratedTestDatabase();
  seedTrackedExercise(db);
  const { events, files, options } = harness(db);

  await replaceAllWithBackup(
    db,
    createBackup({ data: { exercises: [importedExercise] } }),
    options
  );

  expect(events).toEqual([
    'write-safety-backup:local',
    'promote-safety-backup:local',
    'cancel-timer:local',
    'cancel-notification:local',
    'set-theme:imported',
    'refresh:imported',
    'remove-temporary-file:imported'
  ]);
  const [safetyContents] = files.values();
  expect(
    (JSON.parse(safetyContents) as LiftLogBackupV2).data.exercises.map(
      row => row.id
    )
  ).toEqual(['exercise-1']);
});

test('replace-all validates v2 settings before touching timer or safety state', async () => {
  const { replaceAllWithBackup } = await servicePromise;
  const { db } = await createMigratedTestDatabase();
  seedTrackedExercise(db);
  const { events, options } = harness(db);
  const invalidBackup = createBackup({
    data: { exercises: [importedExercise] },
    settings: {
      restTimerNotificationsEnabled: undefined as unknown as boolean
    }
  });

  await expect(
    replaceAllWithBackup(db, invalidBackup, options)
  ).rejects.toThrow();

  expect(events).toEqual([]);
  expect(dataState(db)).toBe('local');
});

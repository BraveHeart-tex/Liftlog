import { appMeta, exercises, healthStepDays } from '@/src/db/schema';
import {
  createBackupSnapshot,
  replaceBackupData
} from '@/src/features/backup/backup.repository';
import { applicationUpdateExclusion } from '@/src/features/app-updates/update-exclusion';
import { BackupValidationError } from '@/src/features/backup/backup.codec';
import { SETTINGS_KEYS } from '@/src/features/settings/settings.repository';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';
import {
  createBackup,
  createStepDay,
  createTrackedSet,
  seedTrackedExercise
} from '@/tests/support/factories';

afterEach(closeTestDatabases);

const createdAt = '2026-09-05T12:00:00.000Z';

test('a Backup snapshot exports user-owned data and settings in v2 order', async () => {
  const { db } = await createMigratedTestDatabase();
  seedTrackedExercise(db);
  createTrackedSet(db, 'set-1', 10, 0);
  db.insert(appMeta)
    .values({
      key: SETTINGS_KEYS.restTimerNotificationsEnabled,
      value: 'true'
    })
    .onConflictDoUpdate({ target: appMeta.key, set: { value: 'true' } })
    .run();

  const snapshot = createBackupSnapshot(db, '1.0.0', 'dark', createdAt);

  const { data: _data, ...envelope } = snapshot;
  const { data: _expectedData, ...expectedEnvelope } = createBackup();
  expect(envelope).toEqual(expectedEnvelope);
  expect(Object.keys(snapshot.data)).toEqual([
    'exercises',
    'workouts',
    'workoutExercises',
    'sets',
    'workoutTemplates',
    'workoutTemplateExercises',
    'settings',
    'themePreference'
  ]);
  expect(snapshot.data.exercises.map(row => row.id)).toEqual(['exercise-1']);
  expect(snapshot.data.workouts.map(row => row.id)).toEqual(['workout-1']);
  expect(snapshot.data.workoutExercises.map(row => row.id)).toEqual([
    'workout-exercise-1'
  ]);
  expect(snapshot.data.sets.map(row => row.id)).toEqual(['set-1']);
  expect(snapshot.data.settings.restTimerNotificationsEnabled).toBe(true);
  expect(snapshot.data.themePreference).toBe('dark');
});

test('replace-all restores a Backup snapshot into another database', async () => {
  applicationUpdateExclusion.hydrate(false);
  const source = await createMigratedTestDatabase();
  seedTrackedExercise(source.db);
  createTrackedSet(source.db, 'set-1', 10, 0);
  const backup = createBackupSnapshot(source.db, '1.0.0', 'system', createdAt);
  const target = await createMigratedTestDatabase();
  target.db
    .insert(exercises)
    .values({
      id: 'exercise-local',
      name: 'Local lift',
      normalizedName: 'local lift',
      trackingType: 'reps'
    })
    .run();
  target.db.insert(healthStepDays).values(createStepDay(1)).run();

  replaceBackupData(target.db, {
    ...backup,
    data: {
      ...backup.data,
      settings: {
        ...backup.data.settings,
        restTimerNotificationsEnabled: true
      }
    }
  });

  const restored = createBackupSnapshot(
    target.db,
    '1.0.0',
    'system',
    createdAt
  );
  expect(restored.data).toEqual({
    ...backup.data,
    settings: { ...backup.data.settings, restTimerNotificationsEnabled: true }
  });
  expect(target.db.select().from(healthStepDays).all()).toEqual([]);
});

test('an invalid v2 preference is rejected before any data is replaced', async () => {
  const { db } = await createMigratedTestDatabase();
  seedTrackedExercise(db);
  const before = createBackupSnapshot(db, '1.0.0', 'system', createdAt);
  const invalidBackup = createBackup({
    settings: {
      restTimerNotificationsEnabled: 'yes' as unknown as boolean
    }
  });

  expect(() => replaceBackupData(db, invalidBackup)).toThrow(
    expect.objectContaining({
      constructor: BackupValidationError,
      category: 'invalid-backup'
    })
  );
  expect(createBackupSnapshot(db, '1.0.0', 'system', createdAt)).toEqual(
    before
  );
});

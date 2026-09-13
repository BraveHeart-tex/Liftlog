import {
  BackupValidationError,
  migrateBackupToCurrent,
  parseBackupEnvelope,
  parseBackupJson,
  parseSupportedBackup,
  serializeBackup
} from '@/src/features/backup/backup.codec';
import type { LiftLogBackupV2 } from '@/src/features/backup/backup.types';
import assert from 'node:assert/strict';
import test from 'node:test';

const backup: LiftLogBackupV2 = {
  format: 'liftlog-backup',
  schemaVersion: 2,
  createdAt: '2026-09-05T12:00:00.000Z',
  appVersion: '1.0.0',
  data: {
    exercises: [
      {
        id: 'exercise-1',
        name: 'Squat',
        normalizedName: 'squat',
        equipment: null,
        trackingType: 'weight_reps',
        primaryMuscles: 'legs',
        secondaryMuscles: null,
        isCustom: 0,
        isArchived: 0,
        createdAt: 1
      }
    ],
    workouts: [],
    workoutExercises: [],
    sets: [],
    workoutTemplates: [],
    workoutTemplateExercises: [],
    settings: {
      weightUnit: 'kg',
      restTimerDuration: 90,
      restTimerPresets: [],
      restTimerNotificationsEnabled: true,
      healthConnectStepsEnabled: false,
      stepGoal: 10000
    },
    themePreference: 'system'
  }
};

test('serializes and parses a supported backup envelope', () => {
  assert.deepEqual(parseBackupJson(serializeBackup(backup)), backup);
});

test('rejects unrelated and future envelopes', () => {
  assert.throws(
    () => parseBackupEnvelope({ ...backup, format: 'other' }),
    (error: unknown) =>
      error instanceof BackupValidationError &&
      error.category === 'unrelated-file'
  );
  assert.throws(
    () => parseBackupEnvelope({ ...backup, schemaVersion: 3 }),
    (error: unknown) =>
      error instanceof BackupValidationError &&
      error.category === 'unsupported-version'
  );
});

test('migrates version 1 backups with rest notifications disabled', () => {
  const versionOne = {
    ...backup,
    schemaVersion: 1,
    data: {
      ...backup.data,
      settings: {
        ...backup.data.settings,
        restTimerNotificationsEnabled: undefined
      }
    }
  };

  const migrated = parseBackupJson(JSON.stringify(versionOne));

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.data.settings.restTimerNotificationsEnabled, false);
});

test('keeps the source version while migrating a version 1 envelope', () => {
  const versionOne = {
    ...backup,
    schemaVersion: 1,
    data: {
      ...backup.data,
      settings: {
        ...backup.data.settings,
        restTimerNotificationsEnabled: undefined
      }
    }
  };

  const parsed = parseSupportedBackup(versionOne);

  assert.equal(parsed.schemaVersion, 1);
  assert.equal(
    migrateBackupToCurrent(parsed).data.settings.restTimerNotificationsEnabled,
    false
  );
});

test('requires a boolean rest notification preference in version 2', () => {
  for (const value of [undefined, null, 'true', 1]) {
    const invalid = {
      ...backup,
      data: {
        ...backup.data,
        settings: {
          ...backup.data.settings,
          restTimerNotificationsEnabled: value
        }
      }
    };

    assert.throws(
      () => parseBackupEnvelope(invalid),
      (error: unknown) =>
        error instanceof BackupValidationError &&
        error.category === 'invalid-backup'
    );
  }
});

test('serializer validates the current settings payload before writing', () => {
  const invalid = {
    ...backup,
    data: {
      ...backup.data,
      settings: {
        ...backup.data.settings,
        restTimerNotificationsEnabled: undefined
      }
    }
  };

  assert.throws(() => serializeBackup(invalid as unknown as LiftLogBackupV2));
});

test('rejects dangling relationships and duplicate active exercise names', () => {
  assert.throws(() =>
    parseBackupEnvelope({
      ...backup,
      data: {
        ...backup.data,
        workouts: [{ id: 'workout-1' }],
        workoutExercises: [
          { id: 'join-1', workoutId: 'missing', exerciseId: 'exercise-1' }
        ]
      }
    })
  );
  assert.throws(() =>
    parseBackupEnvelope({
      ...backup,
      data: {
        ...backup.data,
        exercises: [
          backup.data.exercises[0],
          { ...backup.data.exercises[0], id: 'exercise-2' }
        ]
      }
    })
  );
});

test('rejects malformed JSON', () => {
  assert.throws(
    () => parseBackupJson('{'),
    (error: unknown) =>
      error instanceof BackupValidationError &&
      error.category === 'invalid-json'
  );
});

import {
  BackupValidationError,
  parseBackupEnvelope,
  parseBackupJson,
  serializeBackup
} from '@/src/features/backup/backup.codec';
import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';
import assert from 'node:assert/strict';
import test from 'node:test';

const backup: LiftLogBackupV1 = {
  format: 'liftlog-backup',
  schemaVersion: 1,
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
    () => parseBackupEnvelope({ ...backup, schemaVersion: 2 }),
    (error: unknown) =>
      error instanceof BackupValidationError &&
      error.category === 'unsupported-version'
  );
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

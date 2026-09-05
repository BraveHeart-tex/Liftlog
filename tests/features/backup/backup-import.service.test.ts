import {
  createBackupPreview,
  getBackupErrorCategory
} from '@/src/features/backup/backup-preview';
import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';
import assert from 'node:assert/strict';
import test from 'node:test';

const backup = {
  format: 'liftlog-backup',
  schemaVersion: 1,
  createdAt: '2026-09-05T12:00:00.000Z',
  appVersion: '1.0.0',
  data: {
    exercises: [],
    workouts: [
      {
        id: 'workout-1',
        status: 'in_progress'
      }
    ],
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
} as unknown as LiftLogBackupV1;

test('builds a preview without changing the backup', () => {
  const preview = createBackupPreview(backup);

  assert.deepEqual(preview.counts, {
    exercises: 0,
    workouts: 1,
    workoutExercises: 0,
    sets: 0,
    workoutTemplates: 0,
    workoutTemplateExercises: 0
  });
  assert.equal(preview.replacesActiveWorkout, true);
  assert.equal(backup.data.workouts.length, 1);
});

test('maps unknown file failures to a safe category', () => {
  assert.equal(
    getBackupErrorCategory(new Error('read failed')),
    'unreadable-file'
  );
});

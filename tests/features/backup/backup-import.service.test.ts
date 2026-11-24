import {
  createBackupPreview,
  getBackupErrorCategory
} from '@/src/features/backup/backup-preview';
import type { LiftLogBackupV2 } from '@/src/features/backup/backup.types';
import assert from 'node:assert/strict';
import { createBackup } from '@/tests/support/factories';

const versionOne = createBackup();
const backup = {
  ...versionOne,
  schemaVersion: 1,
  data: {
    ...versionOne.data,
    workouts: [{ id: 'workout-1', status: 'in_progress' }],
    settings: {
      ...versionOne.data.settings,
      restTimerNotificationsEnabled: undefined
    }
  }
} as unknown as LiftLogBackupV2;

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

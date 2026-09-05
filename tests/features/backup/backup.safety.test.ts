import {
  loadSafetyBackupPreviewFromFile,
  type SafetyBackupReader
} from '@/src/features/backup/backup-safety';
import { serializeBackup } from '@/src/features/backup/backup.codec';
import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';
import assert from 'node:assert/strict';
import test from 'node:test';

const safetyUri = 'safety-backup.json';

function createFileReader(files: Map<string, string>): SafetyBackupReader {
  return {
    read: async uri => {
      const contents = files.get(uri);

      if (!contents) {
        throw new Error('File not found');
      }

      return contents;
    }
  };
}

function createBackup(): LiftLogBackupV1 {
  return {
    format: 'liftlog-backup',
    schemaVersion: 1,
    createdAt: '2026-09-05T12:00:00.000Z',
    appVersion: '1.0.0',
    data: {
      exercises: [],
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
}

test('loads a valid safety backup after an app restart', async () => {
  const files = new Map([[safetyUri, serializeBackup(createBackup())]]);

  const firstRead = await loadSafetyBackupPreviewFromFile(
    createFileReader(files),
    safetyUri
  );
  const secondRead = await loadSafetyBackupPreviewFromFile(
    createFileReader(files),
    safetyUri
  );

  assert.equal(firstRead?.preview.counts.workouts, 0);
  assert.deepEqual(secondRead, firstRead);
});

test('does not expose an invalid safety backup as undoable', async () => {
  const files = new Map([[safetyUri, '{"format":"not-liftlog"}']]);

  assert.equal(
    await loadSafetyBackupPreviewFromFile(createFileReader(files), safetyUri),
    null
  );
});

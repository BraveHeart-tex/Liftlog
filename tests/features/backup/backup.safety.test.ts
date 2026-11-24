import {
  loadSafetyBackupPreviewFromFile,
  type SafetyBackupReader
} from '@/src/features/backup/backup-safety';
import { serializeBackup } from '@/src/features/backup/backup.codec';
import assert from 'node:assert/strict';
import { createBackup } from '@/tests/support/factories';

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

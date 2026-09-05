import {
  MAX_BACKUP_BYTES,
  parseBackupJson
} from '@/src/features/backup/backup.codec';
import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';
import {
  createBackupPreview,
  type BackupPreview
} from '@/src/features/backup/backup-preview';
import { File } from 'expo-file-system';

export type BackupPickResult =
  | { status: 'cancelled' }
  | { status: 'preview'; backup: LiftLogBackupV1; preview: BackupPreview };

function isPickerCancellation(error: unknown): boolean {
  return (
    error instanceof Error && /cancel/i.test(`${error.name} ${error.message}`)
  );
}

export async function pickBackupPreview(): Promise<BackupPickResult> {
  let file: Awaited<ReturnType<typeof File.pickFileAsync>>;

  try {
    file = await File.pickFileAsync(undefined, 'application/json');
  } catch (error) {
    if (isPickerCancellation(error)) {
      return { status: 'cancelled' };
    }

    throw error;
  }

  const selectedFile = Array.isArray(file) ? file[0] : file;

  if (
    !selectedFile ||
    !selectedFile.exists ||
    selectedFile.size > MAX_BACKUP_BYTES
  ) {
    throw new Error('The selected backup is too large or cannot be read.');
  }

  const backup = parseBackupJson(await selectedFile.text());

  return { status: 'preview', backup, preview: createBackupPreview(backup) };
}

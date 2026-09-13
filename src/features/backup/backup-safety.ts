import { parseBackupJson } from '@/src/features/backup/backup.codec';
import {
  createBackupPreview,
  type BackupPreview
} from '@/src/features/backup/backup-preview';
import type { LiftLogBackupV2 } from '@/src/features/backup/backup.types';

export interface SafetyBackupReader {
  read(uri: string): Promise<string>;
}

export interface SafetyBackupPreviewResult {
  backup: LiftLogBackupV2;
  preview: BackupPreview;
}

export async function readSafetyBackupFile(
  reader: SafetyBackupReader,
  uri: string
): Promise<LiftLogBackupV2> {
  return parseBackupJson(await reader.read(uri));
}

export async function loadSafetyBackupPreviewFromFile(
  reader: SafetyBackupReader,
  uri: string
): Promise<SafetyBackupPreviewResult | null> {
  try {
    const backup = await readSafetyBackupFile(reader, uri);

    return { backup, preview: createBackupPreview(backup) };
  } catch {
    return null;
  }
}

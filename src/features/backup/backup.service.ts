import type { DrizzleDb } from '@/src/db/client';
import { createBackupSnapshot } from '@/src/features/backup/backup.repository';
import { serializeBackup } from '@/src/features/backup/backup.codec';
import {
  getThemePreference,
  type ThemePreference
} from '@/src/theme/theme-preference';
import Constants from 'expo-constants';
import { Paths } from 'expo-file-system';
import {
  deleteAsync,
  moveAsync,
  writeAsStringAsync
} from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

export interface BackupFilePort {
  write(uri: string, contents: string): Promise<void>;
  promote(fromUri: string, toUri: string): Promise<void>;
  remove(uri: string): Promise<void>;
  share(uri: string, filename: string): Promise<void>;
}

export const nativeBackupFilePort: BackupFilePort = {
  write: (uri, contents) => writeAsStringAsync(uri, contents),
  promote: (fromUri, toUri) => moveAsync({ from: fromUri, to: toUri }),
  remove: uri => deleteAsync(uri, { idempotent: true }),
  share: async (uri, filename) => {
    if (!(await isAvailableAsync())) {
      throw new Error('Native sharing is unavailable.');
    }

    await shareAsync(uri, {
      dialogTitle: filename,
      mimeType: 'application/json',
      UTI: 'public.json'
    });
  }
};

export function backupFilename(date = new Date()): string {
  return `liftlog-backup-${date.toISOString().slice(0, 10)}.json`;
}

export async function exportBackup(
  db: DrizzleDb,
  options: {
    filePort?: BackupFilePort;
    now?: Date;
    themePreference?: ThemePreference;
  } = {}
): Promise<void> {
  const now = options.now ?? new Date();
  const filename = backupFilename(now);
  const uri = `${Paths.cache.uri}/${filename}`;
  const temporaryUri = `${uri}.tmp`;
  const backup = createBackupSnapshot(
    db,
    Constants.expoConfig?.version ?? 'unknown',
    options.themePreference ?? getThemePreference(),
    now.toISOString()
  );
  const port = options.filePort ?? nativeBackupFilePort;
  await port.write(temporaryUri, serializeBackup(backup));

  try {
    await port.promote(temporaryUri, uri);
    await port.share(uri, filename);
  } finally {
    await port.remove(temporaryUri);
    await port.remove(uri);
  }
}

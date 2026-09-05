import type { DrizzleDb } from '@/src/db/client';
import {
  createBackupSnapshot,
  replaceBackupData
} from '@/src/features/backup/backup.repository';
import {
  parseBackupJson,
  serializeBackup
} from '@/src/features/backup/backup.codec';
import Constants from 'expo-constants';
import { Paths } from 'expo-file-system';
import {
  deleteAsync,
  moveAsync,
  writeAsStringAsync
} from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { cancelRestTimerNotification } from '@/src/features/rest-timer/rest-timer-notifications.service';
import { useRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import { withDomainFlowSpan } from '@/src/lib/observability/observability-span';
import { refreshLiveQueries as refreshLiveQueryConsumers } from '@/src/lib/db/live-query-refresh';
import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference
} from '@/src/theme/theme-preference';

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

export const SAFETY_BACKUP_FILENAME = 'liftlog-safety-backup.json';

export interface ReplaceBackupOptions {
  filePort?: BackupFilePort;
  now?: Date;
  themePreference?: ThemePreference;
  cancelTimer?: () => void;
  cancelNotification?: () => Promise<void>;
  setTheme?: (preference: ThemePreference) => void;
  refreshLiveQueries?: () => void;
}

export type ReplaceBackupResult = { status: 'restart-required' };

function safetyBackupUris(now: Date) {
  const uri = `${Paths.document.uri}/${SAFETY_BACKUP_FILENAME}`;

  return { uri, temporaryUri: `${uri}.${now.getTime()}.tmp` };
}

async function replaceAllWithBackupUnsafe(
  db: DrizzleDb,
  backup: LiftLogBackupV1,
  options: ReplaceBackupOptions = {}
): Promise<ReplaceBackupResult> {
  const now = options.now ?? new Date();
  const port = options.filePort ?? nativeBackupFilePort;
  const previousTheme = options.themePreference ?? getThemePreference();
  const { uri, temporaryUri } = safetyBackupUris(now);
  const safetyBackup = createBackupSnapshot(
    db,
    Constants.expoConfig?.version ?? 'unknown',
    previousTheme,
    now.toISOString()
  );
  const safetyContents = serializeBackup(safetyBackup);

  // Parsing the exact bytes that will be promoted makes the safety copy the undo source.
  const validatedSafetyBackup = parseBackupJson(safetyContents);
  await port.write(temporaryUri, safetyContents);

  try {
    await port.promote(temporaryUri, uri);
  } catch (error) {
    await port.remove(temporaryUri);

    throw error;
  }

  const cancelTimer =
    options.cancelTimer ?? (() => useRestTimerStore.getState().cancel());
  const cancelNotification =
    options.cancelNotification ?? cancelRestTimerNotification;
  const setTheme = options.setTheme ?? setThemePreference;
  const refresh = options.refreshLiveQueries ?? refreshLiveQueryConsumers;

  try {
    cancelTimer();
    await cancelNotification();
    replaceBackupData(db, backup);

    setTheme(backup.data.themePreference);
    refresh();
  } catch (error) {
    // SQLite is transactional; this also repairs a theme failure after commit.
    try {
      replaceBackupData(db, validatedSafetyBackup);
      setTheme(previousTheme);
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        'Backup replacement rollback failed.'
      );
    }

    throw error;
  } finally {
    await port.remove(temporaryUri);
  }

  return { status: 'restart-required' };
}

export function replaceAllWithBackup(
  db: DrizzleDb,
  backup: LiftLogBackupV1,
  options: ReplaceBackupOptions = {}
): Promise<ReplaceBackupResult> {
  return withDomainFlowSpan(
    { operation: 'backup.replaceAll', feature: 'backup' },
    () => replaceAllWithBackupUnsafe(db, backup, options)
  );
}

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

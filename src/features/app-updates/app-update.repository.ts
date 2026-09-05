import type { DrizzleDb } from '@/src/db/client';
import {
  getSetting,
  setSetting
} from '@/src/features/settings/settings.repository';
import { withDatabaseSpan } from '@/src/lib/db/database-observability';

const UPDATE_LAST_CHECKED_AT = 'updates.last_checked_at';
const UPDATE_DISMISSED_VERSION = 'updates.dismissed_version_code';

export function getLastUpdateCheckAt(db: DrizzleDb): number | null {
  return withDatabaseSpan(
    {
      operation: 'appUpdates.getLastCheckAt',
      feature: 'app_updates',
      access: 'read'
    },
    () => {
      const value = getSetting(db, UPDATE_LAST_CHECKED_AT);
      const timestamp = value ? Number(value) : NaN;

      return Number.isFinite(timestamp) && timestamp >= 0 ? timestamp : null;
    }
  );
}

export function setLastUpdateCheckAt(db: DrizzleDb, timestamp: number): void {
  withDatabaseSpan(
    {
      operation: 'appUpdates.setLastCheckAt',
      feature: 'app_updates',
      access: 'write'
    },
    () => setSetting(db, UPDATE_LAST_CHECKED_AT, String(timestamp))
  );
}

export function getDismissedUpdateVersion(db: DrizzleDb): number | null {
  return withDatabaseSpan(
    {
      operation: 'appUpdates.getDismissedVersion',
      feature: 'app_updates',
      access: 'read'
    },
    () => {
      const value = getSetting(db, UPDATE_DISMISSED_VERSION);
      const versionCode = value ? Number(value) : NaN;

      return Number.isInteger(versionCode) && versionCode > 0
        ? versionCode
        : null;
    }
  );
}

export function setDismissedUpdateVersion(
  db: DrizzleDb,
  versionCode: number
): void {
  withDatabaseSpan(
    {
      operation: 'appUpdates.setDismissedVersion',
      feature: 'app_updates',
      access: 'write'
    },
    () => setSetting(db, UPDATE_DISMISSED_VERSION, String(versionCode))
  );
}

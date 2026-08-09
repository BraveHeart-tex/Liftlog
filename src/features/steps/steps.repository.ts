import type { DrizzleDb } from '@/src/db/client';
import {
  appMeta,
  healthStepDays,
  type NewHealthStepDay
} from '@/src/db/schema';
import { SETTINGS_KEYS } from '@/src/features/settings/settings.repository';
import { withDatabaseSpan } from '@/src/lib/db/database-observability';
import { desc, sql } from 'drizzle-orm';

const STEP_DAY_CHUNK_SIZE = Math.floor(999 / 5);

export function getRecentStepDaysQuery(db: DrizzleDb, limit: number) {
  return db
    .select()
    .from(healthStepDays)
    .orderBy(desc(healthStepDays.startAt))
    .limit(limit);
}

export function saveStepSyncResult(
  db: DrizzleDb,
  { days, syncedAt }: { days: NewHealthStepDay[]; syncedAt: number }
): void {
  withDatabaseSpan(
    {
      operation: 'steps.saveSyncResult',
      feature: 'steps',
      access: 'write'
    },
    () => {
      if (days.length === 0) {
        return;
      }

      db.transaction(tx => {
        for (let index = 0; index < days.length; index += STEP_DAY_CHUNK_SIZE) {
          tx.insert(healthStepDays)
            .values(days.slice(index, index + STEP_DAY_CHUNK_SIZE))
            .onConflictDoUpdate({
              target: healthStepDays.dateKey,
              set: {
                steps: sql.raw('excluded.steps'),
                startAt: sql.raw('excluded.start_at'),
                endAt: sql.raw('excluded.end_at'),
                syncedAt: sql.raw('excluded.synced_at')
              }
            })
            .run();
        }

        tx.insert(appMeta)
          .values({
            key: SETTINGS_KEYS.stepsLastSyncAt,
            value: String(syncedAt)
          })
          .onConflictDoUpdate({
            target: appMeta.key,
            set: { value: String(syncedAt) }
          })
          .run();
      });
    }
  );
}

import type { DrizzleDb } from '@/src/db/client';
import {
  healthStepDays,
  type HealthStepDay,
  type NewHealthStepDay
} from '@/src/db/schema';
import { desc, eq } from 'drizzle-orm';

export function getRecentStepDaysQuery(db: DrizzleDb, limit: number) {
  return db
    .select()
    .from(healthStepDays)
    .orderBy(desc(healthStepDays.startAt))
    .limit(limit);
}

export function getTodayStepDay(
  db: DrizzleDb,
  dateKey: HealthStepDay['dateKey']
): HealthStepDay | undefined {
  return db
    .select()
    .from(healthStepDays)
    .where(eq(healthStepDays.dateKey, dateKey))
    .get();
}

export function upsertStepDays(db: DrizzleDb, days: NewHealthStepDay[]): void {
  for (const day of days) {
    db.insert(healthStepDays)
      .values(day)
      .onConflictDoUpdate({
        target: healthStepDays.dateKey,
        set: {
          steps: day.steps,
          startAt: day.startAt,
          endAt: day.endAt,
          syncedAt: day.syncedAt
        }
      })
      .run();
  }
}

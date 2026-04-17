import type { DrizzleDb } from '@/src/db/client';
import { appMeta } from '@/src/db/schema';
import type { WeightUnit } from '@/src/lib/utils/weight';
import { eq } from 'drizzle-orm';

export type { WeightUnit };

export const SETTINGS_KEYS = {
  weightUnit: 'settings.weight_unit',
  restTimerDuration: 'settings.rest_timer'
} as const;

export const SETTINGS_DEFAULTS = {
  weightUnit: 'kg' as WeightUnit,
  restTimerDuration: 90
};

export function getSetting(db: DrizzleDb, key: string): string | undefined {
  return db.select().from(appMeta).where(eq(appMeta.key, key)).get()?.value;
}

export function setSetting(db: DrizzleDb, key: string, value: string): void {
  db.insert(appMeta)
    .values({ key, value })
    .onConflictDoUpdate({ target: appMeta.key, set: { value } })
    .run();
}

export function getWeightUnit(db: DrizzleDb): WeightUnit {
  const value = getSetting(db, SETTINGS_KEYS.weightUnit);

  return value === 'lb' ? 'lb' : 'kg';
}

export function setWeightUnit(db: DrizzleDb, unit: WeightUnit): void {
  setSetting(db, SETTINGS_KEYS.weightUnit, unit);
}

export function getRestTimerDuration(db: DrizzleDb): number {
  const value = getSetting(db, SETTINGS_KEYS.restTimerDuration);

  if (!value) {
    return SETTINGS_DEFAULTS.restTimerDuration;
  }

  const parsed = parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 10
    ? parsed
    : SETTINGS_DEFAULTS.restTimerDuration;
}

export function setRestTimerDuration(db: DrizzleDb, seconds: number): void {
  setSetting(db, SETTINGS_KEYS.restTimerDuration, String(seconds));
}

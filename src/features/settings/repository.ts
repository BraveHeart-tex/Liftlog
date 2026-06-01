import type { DrizzleDb } from '@/src/db/client';
import { appMeta } from '@/src/db/schema';
import {
  DEFAULT_THEME_PREFERENCE,
  parseThemePreference,
  persistStoredThemePreference,
  setThemePreferenceSnapshot,
  THEME_PREFERENCE_KEY,
  type ThemePreference
} from '@/src/features/settings/theme-preference-storage';
import type { WeightUnit } from '@/src/lib/utils/weight';
import { eq } from 'drizzle-orm';

export type { WeightUnit };
export type { ThemePreference };

export const SETTINGS_KEYS = {
  weightUnit: 'settings.weight_unit',
  restTimerDuration: 'settings.rest_timer',
  themePreference: THEME_PREFERENCE_KEY,
  healthConnectStepsEnabled: 'settings.health_connect_steps_enabled',
  stepsNotificationEnabled: 'settings.steps_notification_enabled',
  stepGoal: 'settings.step_goal',
  stepsLastSyncAt: 'settings.steps_last_sync_at'
} as const;

export const SETTINGS_DEFAULTS = {
  weightUnit: 'kg' as WeightUnit,
  restTimerDuration: 90,
  themePreference: DEFAULT_THEME_PREFERENCE,
  healthConnectStepsEnabled: false,
  stepsNotificationEnabled: false,
  stepGoal: 10000
};

export function getSetting(db: DrizzleDb, key: string): string | undefined {
  return db.select().from(appMeta).where(eq(appMeta.key, key)).get()?.value;
}

export function getSettingsQuery(db: DrizzleDb) {
  return db.select().from(appMeta);
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

export function getThemePreference(db: DrizzleDb): ThemePreference {
  const preference = parseThemePreference(
    getSetting(db, SETTINGS_KEYS.themePreference)
  );

  setThemePreferenceSnapshot(preference);
  persistStoredThemePreference(preference);

  return preference;
}

export function persistThemePreference(
  db: DrizzleDb,
  preference: ThemePreference
): void {
  setSetting(db, SETTINGS_KEYS.themePreference, preference);
  persistStoredThemePreference(preference);
}

export function parseBooleanSetting(value: string | undefined): boolean {
  return value === 'true';
}

export function parseStepGoal(value: string | undefined): number {
  if (!value) {
    return SETTINGS_DEFAULTS.stepGoal;
  }

  const parsed = parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 1000
    ? parsed
    : SETTINGS_DEFAULTS.stepGoal;
}

export function getHealthConnectStepsEnabled(db: DrizzleDb): boolean {
  return parseBooleanSetting(
    getSetting(db, SETTINGS_KEYS.healthConnectStepsEnabled)
  );
}

export function setHealthConnectStepsEnabled(
  db: DrizzleDb,
  isEnabled: boolean
): void {
  setSetting(db, SETTINGS_KEYS.healthConnectStepsEnabled, String(isEnabled));
}

export function getStepsNotificationEnabled(db: DrizzleDb): boolean {
  return parseBooleanSetting(
    getSetting(db, SETTINGS_KEYS.stepsNotificationEnabled)
  );
}

export function setStepsNotificationEnabled(
  db: DrizzleDb,
  isEnabled: boolean
): void {
  setSetting(db, SETTINGS_KEYS.stepsNotificationEnabled, String(isEnabled));
}

export function getStepGoal(db: DrizzleDb): number {
  return parseStepGoal(getSetting(db, SETTINGS_KEYS.stepGoal));
}

export function setStepGoal(db: DrizzleDb, goal: number): void {
  setSetting(db, SETTINGS_KEYS.stepGoal, String(goal));
}

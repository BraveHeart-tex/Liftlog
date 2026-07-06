import type { DrizzleDb } from '@/src/db/client';
import { appMeta } from '@/src/db/schema';
import {
  MAX_STEP_GOAL,
  MIN_STEP_GOAL
} from '@/src/features/steps/steps.constants';
import { isValidStepGoal } from '@/src/features/steps/steps.validation';
import {
  MAX_REST_TIMER_SECONDS,
  MIN_REST_TIMER_SECONDS
} from '@/src/features/workouts/rest-timer.constants';
import { generateUuid } from '@/src/lib/utils/uuid.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { eq } from 'drizzle-orm';

export type { WeightUnit };

export interface RestTimerPreset {
  id: string;
  name: string;
  durationSeconds: number;
}

export const MAX_REST_TIMER_PRESETS = 8;
export const REST_TIMER_PRESET_NAME_MAX_LENGTH = 30;

export const SETTINGS_KEYS = {
  weightUnit: 'settings.weight_unit',
  restTimerDuration: 'settings.rest_timer',
  restTimerPresets: 'settings.rest_timer_presets',
  healthConnectStepsEnabled: 'settings.health_connect_steps_enabled',
  stepsNotificationEnabled: 'settings.steps_notification_enabled',
  stepGoal: 'settings.step_goal',
  stepsLastSyncAt: 'settings.steps_last_sync_at'
} as const;

export const SETTINGS_DEFAULTS = {
  weightUnit: 'kg' as WeightUnit,
  restTimerDuration: 90,
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

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 10
    ? parsed
    : SETTINGS_DEFAULTS.restTimerDuration;
}

export function setRestTimerDuration(db: DrizzleDb, seconds: number): void {
  setSetting(db, SETTINGS_KEYS.restTimerDuration, String(seconds));
}

function createRestTimerPreset(
  name: string,
  durationSeconds: number
): RestTimerPreset {
  return {
    id: generateUuid(),
    name,
    durationSeconds
  };
}

function normalizeRestTimerPreset(value: unknown): RestTimerPreset | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<RestTimerPreset>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const durationSeconds =
    typeof candidate.durationSeconds === 'number'
      ? Math.floor(candidate.durationSeconds)
      : 0;

  if (
    !candidate.id ||
    typeof candidate.id !== 'string' ||
    !name ||
    durationSeconds < MIN_REST_TIMER_SECONDS ||
    durationSeconds > MAX_REST_TIMER_SECONDS
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    name: name.slice(0, REST_TIMER_PRESET_NAME_MAX_LENGTH),
    durationSeconds
  };
}

function parseRestTimerPresets(value: string | undefined): RestTimerPreset[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const presets = parsed
      .map(normalizeRestTimerPreset)
      .filter((preset): preset is RestTimerPreset => Boolean(preset))
      .slice(0, MAX_REST_TIMER_PRESETS);

    return presets;
  } catch {
    return [];
  }
}

export function serializeRestTimerPresets(presets: RestTimerPreset[]) {
  return JSON.stringify(presets);
}

export function getRestTimerPresets(db: DrizzleDb): RestTimerPreset[] {
  const value = getSetting(db, SETTINGS_KEYS.restTimerPresets);

  return parseRestTimerPresets(value);
}

export function getRestTimerPresetsFromValue(
  value: string | undefined
): RestTimerPreset[] {
  return parseRestTimerPresets(value);
}

export function setRestTimerPresets(
  db: DrizzleDb,
  presets: RestTimerPreset[]
): void {
  const normalizedPresets = presets
    .map(normalizeRestTimerPreset)
    .filter((preset): preset is RestTimerPreset => Boolean(preset))
    .slice(0, MAX_REST_TIMER_PRESETS);

  setSetting(
    db,
    SETTINGS_KEYS.restTimerPresets,
    serializeRestTimerPresets(normalizedPresets)
  );
}

export function addRestTimerPreset(
  db: DrizzleDb,
  preset: Omit<RestTimerPreset, 'id'>
): void {
  const presets = getRestTimerPresets(db);

  if (presets.length >= MAX_REST_TIMER_PRESETS) {
    throw new RangeError('Only 8 rest timer presets are allowed.');
  }

  setRestTimerPresets(db, [
    ...presets,
    createRestTimerPreset(preset.name, preset.durationSeconds)
  ]);
}

export function updateRestTimerPreset(
  db: DrizzleDb,
  preset: RestTimerPreset
): void {
  const presets = getRestTimerPresets(db);

  setRestTimerPresets(
    db,
    presets.map(currentPreset =>
      currentPreset.id === preset.id ? preset : currentPreset
    )
  );
}

export function deleteRestTimerPreset(db: DrizzleDb, id: string): void {
  const presets = getRestTimerPresets(db);

  setRestTimerPresets(
    db,
    presets.filter(preset => preset.id !== id)
  );
}

export function parseBooleanSetting(value: string | undefined): boolean {
  return value === 'true';
}

export function parseStepGoal(value: string | undefined): number {
  if (!value) {
    return SETTINGS_DEFAULTS.stepGoal;
  }

  const parsed = parseInt(value, 10);

  return isValidStepGoal(parsed) ? parsed : SETTINGS_DEFAULTS.stepGoal;
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
  if (!isValidStepGoal(goal)) {
    throw new RangeError(
      `Step goal must be between ${MIN_STEP_GOAL} and ${MAX_STEP_GOAL}.`
    );
  }

  setSetting(db, SETTINGS_KEYS.stepGoal, String(goal));
}

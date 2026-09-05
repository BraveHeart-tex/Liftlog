import { TRACKING_TYPES } from '@/src/features/progress/tracking.domain';
import { normalizeExerciseName } from '@/src/features/exercises/exercise-name.utils';
import {
  MAX_REST_TIMER_PRESETS,
  REST_TIMER_PRESET_NAME_MAX_LENGTH
} from '@/src/features/settings/settings.repository';
import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';

export const BACKUP_FORMAT = 'liftlog-backup';

export const BACKUP_SCHEMA_VERSION = 1;

export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
const MAX_ROWS = 100_000;
const MAX_STRING_LENGTH = 20_000;
const MAX_ID_LENGTH = 200;
const MAX_NESTED_JSON_LENGTH = 200_000;

export type BackupErrorCategory =
  | 'unreadable-file'
  | 'invalid-json'
  | 'unrelated-file'
  | 'unsupported-version'
  | 'invalid-backup'
  | 'limit-exceeded';

export class BackupValidationError extends Error {
  constructor(
    public readonly category: BackupErrorCategory,
    message = 'The backup file is not valid.'
  ) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

export type ParsedSupportedBackup = {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  backup: LiftLogBackupV1;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isNullable = (value: unknown, predicate: (value: unknown) => boolean) =>
  value === null || predicate(value);

function fail(category: BackupErrorCategory): never {
  throw new BackupValidationError(category);
}

function string(value: unknown, max = MAX_STRING_LENGTH): value is string {
  return typeof value === 'string' && value.length <= max;
}

function requiredString(
  value: unknown,
  max = MAX_STRING_LENGTH
): value is string {
  return string(value, max) && value.length > 0;
}

function timestamp(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function isoDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 64 &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function nullableTimestamp(value: unknown) {
  return value === null || timestamp(value);
}

function validateRows(data: Record<string, unknown>) {
  const collections = [
    'exercises',
    'workouts',
    'workoutExercises',
    'sets',
    'workoutTemplates',
    'workoutTemplateExercises'
  ] as const;
  const idsByCollection = new Map<string, Set<string>>();

  for (const key of collections) {
    const rows = data[key];

    if (!Array.isArray(rows)) {
      fail('invalid-backup');
    }

    if (rows.length > MAX_ROWS) {
      fail('limit-exceeded');
    }

    const ids = new Set<string>();

    for (const row of rows) {
      if (
        !isObject(row) ||
        !requiredString(row.id, MAX_ID_LENGTH) ||
        ids.has(row.id)
      ) {
        fail('invalid-backup');
      }

      ids.add(row.id);
    }

    idsByCollection.set(key, ids);
  }

  const rows = (key: string) => data[key] as Record<string, unknown>[];
  const validEnum = (value: unknown, values: readonly string[]) =>
    typeof value === 'string' && values.includes(value);
  const validNullableString = (value: unknown) =>
    isNullable(value, v => string(v));
  const validJson = (value: unknown) =>
    isNullable(value, v => {
      if (!string(v, MAX_NESTED_JSON_LENGTH)) {
        return false;
      }

      try {
        JSON.parse(v);

        return true;
      } catch {
        return false;
      }
    });

  for (const row of rows('exercises')) {
    if (
      !requiredString(row.name) ||
      !requiredString(row.normalizedName) ||
      row.normalizedName !== normalizeExerciseName(row.name) ||
      !validNullableString(row.equipment) ||
      !validEnum(row.trackingType, TRACKING_TYPES) ||
      !validNullableString(row.primaryMuscles) ||
      !validNullableString(row.secondaryMuscles) ||
      ![0, 1].includes(row.isCustom as number) ||
      ![0, 1].includes(row.isArchived as number) ||
      !timestamp(row.createdAt)
    ) {
      fail('invalid-backup');
    }
  }

  for (const row of rows('workouts')) {
    if (
      !requiredString(row.name) ||
      !validEnum(row.status, [
        'in_progress',
        'completed',
        'historical_draft',
        'historical_edit_draft'
      ]) ||
      !timestamp(row.startedAt) ||
      typeof row.dateKey !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.dateKey) ||
      !nullableTimestamp(row.completedAt) ||
      !validNullableString(row.notes) ||
      !validJson(row.sourceSnapshot) ||
      !isNullable(row.sourceWorkoutId, v => requiredString(v, MAX_ID_LENGTH))
    ) {
      fail('invalid-backup');
    }
  }

  for (const row of rows('workoutExercises')) {
    if (
      !requiredString(row.workoutId, MAX_ID_LENGTH) ||
      !requiredString(row.exerciseId, MAX_ID_LENGTH) ||
      !Number.isInteger(row.order) ||
      (row.order as number) < 0 ||
      !isNullable(row.supersetId, v => requiredString(v, MAX_ID_LENGTH)) ||
      !validNullableString(row.notes) ||
      !isNullable(row.sourceWorkoutExerciseId, v =>
        requiredString(v, MAX_ID_LENGTH)
      )
    ) {
      fail('invalid-backup');
    }
  }

  for (const row of rows('sets')) {
    if (
      !requiredString(row.workoutExerciseId, MAX_ID_LENGTH) ||
      !Number.isInteger(row.order) ||
      (row.order as number) < 0 ||
      !isNullable(row.weightKg, isFiniteNumber) ||
      !isNullable(row.reps, v => Number.isInteger(v) && (v as number) >= 0) ||
      !isNullable(row.distanceMeters, isFiniteNumber) ||
      !isNullable(
        row.durationMs,
        v => Number.isInteger(v) && (v as number) >= 0
      ) ||
      !isNullable(
        row.durationSeconds,
        v => Number.isInteger(v) && (v as number) >= 0
      ) ||
      !isNullable(
        row.rpe,
        v => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 10
      ) ||
      !validEnum(row.status, ['pending', 'completed']) ||
      !nullableTimestamp(row.completedAt) ||
      !isNullable(row.sourceSetId, v => requiredString(v, MAX_ID_LENGTH))
    ) {
      fail('invalid-backup');
    }
  }

  for (const row of rows('workoutTemplates')) {
    if (
      !requiredString(row.name) ||
      !isNullable(row.sourceWorkoutId, v => requiredString(v, MAX_ID_LENGTH)) ||
      !timestamp(row.createdAt) ||
      !timestamp(row.updatedAt)
    ) {
      fail('invalid-backup');
    }
  }

  for (const row of rows('workoutTemplateExercises')) {
    if (
      !requiredString(row.templateId, MAX_ID_LENGTH) ||
      !requiredString(row.exerciseId, MAX_ID_LENGTH) ||
      !Number.isInteger(row.order) ||
      (row.order as number) < 0 ||
      !isNullable(row.supersetId, v => requiredString(v, MAX_ID_LENGTH))
    ) {
      fail('invalid-backup');
    }
  }

  const references = [
    ['workoutExercises', 'workoutId', 'workouts'],
    ['workoutExercises', 'exerciseId', 'exercises'],
    ['sets', 'workoutExerciseId', 'workoutExercises'],
    ['workouts', 'sourceWorkoutId', 'workouts'],
    ['workoutTemplates', 'sourceWorkoutId', 'workouts'],
    ['workoutExercises', 'sourceWorkoutExerciseId', 'workoutExercises'],
    ['sets', 'sourceSetId', 'sets'],
    ['workoutTemplateExercises', 'templateId', 'workoutTemplates'],
    ['workoutTemplateExercises', 'exerciseId', 'exercises']
  ] as const;

  for (const [collection, field, target] of references) {
    for (const row of rows(collection)) {
      const value = row[field];

      if (
        value !== null &&
        value !== undefined &&
        !idsByCollection.get(target)?.has(value as string)
      ) {
        fail('invalid-backup');
      }
    }
  }

  for (const collection of [
    'workoutExercises',
    'sets',
    'workoutTemplateExercises'
  ] as const) {
    const orderKeys = new Set<string>();

    for (const row of rows(collection)) {
      const parent = row.workoutId ?? row.workoutExerciseId ?? row.templateId;
      const key = `${String(parent)}:${String(row.order)}`;

      if (orderKeys.has(key)) {
        fail('invalid-backup');
      }

      orderKeys.add(key);
    }
  }

  const activeNames = new Set<string>();

  for (const row of rows('exercises')) {
    if (row.isArchived === 0) {
      if (activeNames.has(row.normalizedName as string)) {
        fail('invalid-backup');
      }

      activeNames.add(row.normalizedName as string);
    }
  }
}

export function parseBackupEnvelope(value: unknown): LiftLogBackupV1 {
  if (!isObject(value)) {
    fail('invalid-backup');
  }

  if (value.format !== BACKUP_FORMAT) {
    fail('unrelated-file');
  }

  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    fail('unsupported-version');
  }

  if (
    !isoDate(value.createdAt) ||
    !requiredString(value.appVersion, 100) ||
    !isObject(value.data)
  ) {
    fail('invalid-backup');
  }

  validateRows(value.data);

  if (
    !['system', 'light', 'dark'].includes(String(value.data.themePreference))
  ) {
    fail('invalid-backup');
  }

  const settings = value.data.settings;

  if (
    !isObject(settings) ||
    !['kg', 'lb'].includes(String(settings.weightUnit)) ||
    !isFiniteNumber(settings.restTimerDuration) ||
    !Number.isInteger(settings.restTimerDuration) ||
    settings.restTimerDuration < 10 ||
    settings.restTimerDuration > 3600 ||
    !Array.isArray(settings.restTimerPresets) ||
    settings.restTimerPresets.length > MAX_REST_TIMER_PRESETS ||
    typeof settings.healthConnectStepsEnabled !== 'boolean' ||
    !Number.isInteger(settings.stepGoal) ||
    (settings.stepGoal as number) < 1000 ||
    (settings.stepGoal as number) > 50000
  ) {
    fail('invalid-backup');
  }

  const presetIds = new Set<string>();

  for (const preset of settings.restTimerPresets) {
    if (
      !isObject(preset) ||
      !requiredString(preset.id, MAX_ID_LENGTH) ||
      presetIds.has(preset.id) ||
      !requiredString(preset.name, REST_TIMER_PRESET_NAME_MAX_LENGTH) ||
      !Number.isInteger(preset.durationSeconds) ||
      (preset.durationSeconds as number) < 10 ||
      (preset.durationSeconds as number) > 3600
    ) {
      fail('invalid-backup');
    }

    presetIds.add(preset.id);
  }

  return value as unknown as LiftLogBackupV1;
}

export function parseSupportedBackup(value: unknown): ParsedSupportedBackup {
  const backup = parseBackupEnvelope(value);

  return { schemaVersion: BACKUP_SCHEMA_VERSION, backup };
}

export function migrateBackupToCurrent(
  parsedBackup: ParsedSupportedBackup
): LiftLogBackupV1 {
  switch (parsedBackup.schemaVersion) {
    case BACKUP_SCHEMA_VERSION:
      return parsedBackup.backup;
    default:
      throw new BackupValidationError('unsupported-version');
  }
}

export function parseBackupJson(json: string): LiftLogBackupV1 {
  if (typeof json !== 'string') {
    fail('unreadable-file');
  }

  if (new TextEncoder().encode(json).byteLength > MAX_BACKUP_BYTES) {
    fail('limit-exceeded');
  }

  try {
    return parseBackupEnvelope(JSON.parse(json));
  } catch (error) {
    if (error instanceof BackupValidationError) {
      throw error;
    }

    throw new BackupValidationError(
      'invalid-json',
      'The backup file could not be read.'
    );
  }
}

export function serializeBackup(backup: LiftLogBackupV1): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

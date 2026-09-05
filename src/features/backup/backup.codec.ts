import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';

export const BACKUP_FORMAT = 'liftlog-backup';

export const BACKUP_SCHEMA_VERSION = 1;

export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

export type BackupErrorCategory =
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

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function fail(category: BackupErrorCategory): never {
  throw new BackupValidationError(category);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validateRows(data: Record<string, unknown>) {
  const collections = [
    'exercises',
    'workouts',
    'workoutExercises',
    'sets',
    'workoutTemplates',
    'workoutTemplateExercises'
  ];
  const idsByCollection = new Map<string, Set<string>>();

  for (const key of collections) {
    if (!Array.isArray(data[key]) || data[key].length > 100_000) {
      fail('limit-exceeded');
    }

    const ids = new Set<string>();

    for (const row of data[key] as unknown[]) {
      if (
        !isObject(row) ||
        typeof row.id !== 'string' ||
        row.id.length > 200 ||
        ids.has(row.id)
      ) {
        fail('invalid-backup');
      }

      ids.add(row.id);
    }

    idsByCollection.set(key, ids);
  }

  const rows = (key: string) => data[key] as Record<string, unknown>[];
  const references = [
    ['workoutExercises', 'workoutId', 'workouts'],
    ['workoutExercises', 'exerciseId', 'exercises'],
    ['sets', 'workoutExerciseId', 'workoutExercises'],
    ['workoutTemplates', 'sourceWorkoutId', 'workouts'],
    ['workoutTemplateExercises', 'templateId', 'workoutTemplates'],
    ['workoutTemplateExercises', 'exerciseId', 'exercises']
  ] as const;

  for (const [collection, field, target] of references) {
    for (const row of rows(collection)) {
      const value = row[field];

      if (
        value !== null &&
        value !== undefined &&
        (typeof value !== 'string' || !idsByCollection.get(target)?.has(value))
      ) {
        fail('invalid-backup');
      }
    }
  }

  const activeNames = new Set<string>();

  for (const row of rows('exercises')) {
    if (row.isArchived === 0 && typeof row.normalizedName === 'string') {
      if (activeNames.has(row.normalizedName)) {
        fail('invalid-backup');
      }

      activeNames.add(row.normalizedName);
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
    !isIsoDate(value.createdAt) ||
    typeof value.appVersion !== 'string' ||
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

  if (!isObject(value.data.settings)) {
    fail('invalid-backup');
  }

  return value as unknown as LiftLogBackupV1;
}

export function parseBackupJson(json: string): LiftLogBackupV1 {
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

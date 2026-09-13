import type { DrizzleDb } from '@/src/db/client';
import {
  appMeta,
  exercises,
  sets,
  workoutExercises,
  workoutTemplateExercises,
  workoutTemplates,
  workouts
} from '@/src/db/schema';
import {
  createBackupSnapshot,
  replaceBackupData
} from '@/src/features/backup/backup.repository';
import { BackupValidationError } from '@/src/features/backup/backup.codec';
import type { LiftLogBackupV2 } from '@/src/features/backup/backup.types';
import { SETTINGS_KEYS } from '@/src/features/settings/settings.repository';
import assert from 'node:assert/strict';
import test from 'node:test';

function createSnapshotDatabase(
  settingsRows: { key: string; value: string }[]
) {
  const rowsByTable = new Map<unknown, unknown[]>([
    [appMeta, settingsRows],
    [exercises, []],
    [workouts, []],
    [workoutExercises, []],
    [sets, []],
    [workoutTemplates, []],
    [workoutTemplateExercises, []]
  ]);
  const transaction = {
    select() {
      let table: unknown;
      const query = {
        from(nextTable: unknown) {
          table = nextTable;

          return query;
        },
        where() {
          return query;
        },
        orderBy() {
          return query;
        },
        all() {
          return rowsByTable.get(table) ?? [];
        }
      };

      return query;
    }
  };

  return {
    transaction<T>(operation: (tx: typeof transaction) => T) {
      return operation(transaction);
    }
  } as unknown as DrizzleDb;
}

function createEmptyBackup(
  restTimerNotificationsEnabled: boolean
): LiftLogBackupV2 {
  return {
    format: 'liftlog-backup',
    schemaVersion: 2,
    createdAt: '2026-09-05T12:00:00.000Z',
    appVersion: '1.0.0',
    data: {
      exercises: [],
      workouts: [],
      workoutExercises: [],
      sets: [],
      workoutTemplates: [],
      workoutTemplateExercises: [],
      settings: {
        weightUnit: 'kg',
        restTimerDuration: 90,
        restTimerPresets: [],
        restTimerNotificationsEnabled,
        healthConnectStepsEnabled: false,
        stepGoal: 10000
      },
      themePreference: 'system'
    }
  };
}

test('exports the user-owned rest notification intent in v2 settings', () => {
  const db = createSnapshotDatabase([
    { key: SETTINGS_KEYS.weightUnit, value: 'kg' },
    { key: SETTINGS_KEYS.restTimerDuration, value: '90' },
    { key: SETTINGS_KEYS.restTimerPresets, value: '[]' },
    { key: SETTINGS_KEYS.restTimerNotificationsEnabled, value: 'true' },
    { key: SETTINGS_KEYS.healthConnectStepsEnabled, value: 'false' },
    { key: SETTINGS_KEYS.stepGoal, value: '10000' }
  ]);

  const snapshot = createBackupSnapshot(
    db,
    '1.0.0',
    'system',
    '2026-09-05T12:00:00.000Z'
  );

  assert.equal(snapshot.schemaVersion, 2);
  assert.equal(snapshot.data.settings.restTimerNotificationsEnabled, true);
  assert.deepEqual(Object.keys(snapshot.data), [
    'exercises',
    'workouts',
    'workoutExercises',
    'sets',
    'workoutTemplates',
    'workoutTemplateExercises',
    'settings',
    'themePreference'
  ]);
});

test('restores enabled intent as a user-owned setting only', () => {
  const insertedValues: unknown[][] = [];
  const transaction = {
    delete() {
      return { run() {} };
    },
    insert() {
      return {
        values(values: unknown[]) {
          insertedValues.push(values);

          return {
            onConflictDoUpdate() {
              return { run() {} };
            }
          };
        }
      };
    },
    all() {
      return [];
    }
  };
  const db = {
    transaction<T>(operation: (tx: typeof transaction) => T) {
      return operation(transaction);
    }
  } as unknown as DrizzleDb;

  replaceBackupData(db, createEmptyBackup(true));

  const settings = insertedValues[0] as { key: string; value: string }[];

  assert.deepEqual(
    settings.find(
      setting => setting.key === SETTINGS_KEYS.restTimerNotificationsEnabled
    ),
    {
      key: SETTINGS_KEYS.restTimerNotificationsEnabled,
      value: 'true'
    }
  );
});

test('rejects an invalid v2 preference before opening a replacement transaction', () => {
  let transactionCalls = 0;
  const db = {
    transaction() {
      transactionCalls += 1;

      throw new Error('mutation must not start');
    }
  } as unknown as DrizzleDb;
  const invalidBackup = {
    format: 'liftlog-backup',
    schemaVersion: 2,
    createdAt: '2026-09-05T12:00:00.000Z',
    appVersion: '1.0.0',
    data: {
      exercises: [],
      workouts: [],
      workoutExercises: [],
      sets: [],
      workoutTemplates: [],
      workoutTemplateExercises: [],
      settings: {
        weightUnit: 'kg',
        restTimerDuration: 90,
        restTimerPresets: [],
        restTimerNotificationsEnabled: 'yes',
        healthConnectStepsEnabled: false,
        stepGoal: 10000
      },
      themePreference: 'system'
    }
  } as unknown as LiftLogBackupV2;

  assert.throws(
    () => replaceBackupData(db, invalidBackup),
    (error: unknown) =>
      error instanceof BackupValidationError &&
      error.category === 'invalid-backup'
  );
  assert.equal(transactionCalls, 0);
});

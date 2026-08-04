import {
  exercises,
  personalRecords,
  sets,
  workoutExercises,
  workouts,
  workoutTemplates
} from '@/src/db/schema';
import {
  createDrizzleDb,
  runDatabaseMigrations,
  type DrizzleDb
} from '@/src/db/client';
import {
  completeWorkout,
  createCompletedSet,
  deleteCompletedSet,
  deleteWorkout,
  getRecentExerciseIdsQuery,
  updateCompletedSet
} from '@/src/features/workouts/workout.repository';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import type { SQLiteDatabase } from 'expo-sqlite';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync
} from 'node:sqlite';
import path from 'node:path';
import test from 'node:test';

interface MigrationJournalEntry {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface MigrationJournal {
  entries: MigrationJournalEntry[];
}

interface ForeignKeyListRow {
  table: string;
  from: string;
  on_delete: string;
}

class NodeSQLiteStatement {
  constructor(
    private readonly statement: StatementSync,
    private readonly database: DatabaseSync
  ) {}

  executeSync(params: SQLInputValue[] = []) {
    return this.execute(params, false);
  }

  executeForRawResultSync(params: SQLInputValue[] = []) {
    return this.execute(params, true);
  }

  private execute(params: SQLInputValue[], rawResult: boolean) {
    const rows = this.statement.all(...params);
    const metadata = this.database
      .prepare(
        'SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowId'
      )
      .get();

    if (!metadata) {
      throw new Error('SQLite did not return statement metadata.');
    }

    return {
      changes: Number(metadata.changes),
      lastInsertRowId: Number(metadata.lastInsertRowId),
      getAllSync: () =>
        rawResult ? rows.map(row => Object.values(row)) : rows,
      getFirstSync: () => {
        const row = rows[0] ?? null;

        return rawResult && row ? Object.values(row) : row;
      }
    };
  }
}

class NodeSQLiteDatabase {
  private readonly database = new DatabaseSync(':memory:');

  closeSync() {
    this.database.close();
  }

  execSync(source: string) {
    this.database.exec(source);
  }

  async execAsync(source: string) {
    this.execSync(source);
  }

  prepareSync(source: string) {
    return new NodeSQLiteStatement(
      this.database.prepare(source),
      this.database
    );
  }

  getFirstSync<T>(source: string): T | null {
    return (this.database.prepare(source).get() as T | undefined) ?? null;
  }

  getAllSync<T>(source: string): T[] {
    return this.database.prepare(source).all() as T[];
  }

  async getFirstAsync<T>(source: string): Promise<T | null> {
    return this.getFirstSync<T>(source);
  }

  async getAllAsync<T>(source: string): Promise<T[]> {
    return this.getAllSync<T>(source);
  }
}

function loadMigrations(maxIndex?: number) {
  const migrationsDirectory = path.resolve(process.cwd(), 'src/db/migrations');
  const journal = JSON.parse(
    readFileSync(path.join(migrationsDirectory, 'meta/_journal.json'), 'utf8')
  ) as MigrationJournal;
  const entries = journal.entries.filter(
    entry => maxIndex === undefined || entry.idx <= maxIndex
  );

  return {
    journal: { entries },
    migrations: Object.fromEntries(
      entries.map(entry => [
        `m${entry.idx.toString().padStart(4, '0')}`,
        readFileSync(path.join(migrationsDirectory, `${entry.tag}.sql`), 'utf8')
      ])
    )
  };
}

async function createMigratedTestDatabase() {
  const nodeClient = new NodeSQLiteDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations())
  );

  return { db, nodeClient };
}

function seedTrackedExercise(db: DrizzleDb) {
  db.insert(exercises)
    .values({
      id: 'exercise-1',
      name: 'Push-up',
      category: 'chest',
      trackingType: 'reps'
    })
    .run();
  db.insert(workouts)
    .values({
      id: 'workout-1',
      name: 'Workout',
      status: 'in_progress',
      startedAt: 1,
      dateKey: '1970-01-01'
    })
    .run();
  db.insert(workoutExercises)
    .values({
      id: 'workout-exercise-1',
      workoutId: 'workout-1',
      exerciseId: 'exercise-1',
      order: 0
    })
    .run();
}

function createTrackedSet(
  db: DrizzleDb,
  id: string,
  reps: number,
  order: number
) {
  return createCompletedSet(db, {
    id,
    workoutExerciseId: 'workout-exercise-1',
    order,
    reps,
    completedAt: order + 1
  });
}

function getPersonalRecordSetIds(db: DrizzleDb) {
  return db
    .select({ setId: personalRecords.setId })
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, 'exercise-1'))
    .orderBy(personalRecords.achievedAt)
    .all()
    .map(record => record.setId);
}

function rejectPersonalRecordRebuilds(nodeClient: NodeSQLiteDatabase) {
  nodeClient.execSync(`
    CREATE TRIGGER reject_personal_record_rebuild
    BEFORE DELETE ON personal_records
    BEGIN
      SELECT RAISE(ABORT, 'unexpected personal record rebuild');
    END;
  `);
}

test('production initialization enables workout delete foreign-key actions', async () => {
  const nodeClient = new NodeSQLiteDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  try {
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations(9))
    );

    db.insert(exercises)
      .values({
        id: 'exercise-1',
        name: 'Squat',
        category: 'legs'
      })
      .run();
    db.insert(workouts)
      .values({
        id: 'workout-1',
        name: 'Leg Day',
        status: 'completed',
        startedAt: 1,
        dateKey: '1970-01-01'
      })
      .run();
    db.insert(workoutTemplates)
      .values({
        id: 'template-1',
        name: 'Leg Template',
        sourceWorkoutId: 'workout-1',
        createdAt: 1,
        updatedAt: 1
      })
      .run();
    db.insert(workoutExercises)
      .values({
        id: 'workout-exercise-1',
        workoutId: 'workout-1',
        exerciseId: 'exercise-1',
        order: 0
      })
      .run();
    db.insert(sets)
      .values({
        id: 'set-1',
        workoutExerciseId: 'workout-exercise-1',
        order: 0
      })
      .run();

    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations())
    );

    assert.equal(
      nodeClient.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys;')
        ?.foreign_keys,
      1
    );

    const templateForeignKeys = nodeClient.getAllSync<ForeignKeyListRow>(
      "PRAGMA foreign_key_list('workout_templates');"
    );
    const workoutExerciseForeignKeys = nodeClient.getAllSync<ForeignKeyListRow>(
      "PRAGMA foreign_key_list('workout_exercises');"
    );
    const setForeignKeys = nodeClient.getAllSync<ForeignKeyListRow>(
      "PRAGMA foreign_key_list('sets');"
    );

    assert.equal(
      templateForeignKeys.find(row => row.from === 'source_workout_id')
        ?.on_delete,
      'SET NULL'
    );
    assert.equal(
      workoutExerciseForeignKeys.find(row => row.table === 'workouts')
        ?.on_delete,
      'CASCADE'
    );
    assert.equal(
      setForeignKeys.find(row => row.table === 'workout_exercises')?.on_delete,
      'CASCADE'
    );

    assert.equal(deleteWorkout(db, 'workout-1'), true);
    assert.equal(deleteWorkout(db, 'workout-1'), false);

    assert.equal(
      db
        .select({ sourceWorkoutId: workoutTemplates.sourceWorkoutId })
        .from(workoutTemplates)
        .where(eq(workoutTemplates.id, 'template-1'))
        .get()?.sourceWorkoutId,
      null
    );
    assert.equal(
      db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.id, 'workout-exercise-1'))
        .get(),
      undefined
    );
    assert.equal(
      db.select().from(sets).where(eq(sets.id, 'set-1')).get(),
      undefined
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('completeWorkout conditionally completes in-progress workouts', async t => {
  const nodeClient = new NodeSQLiteDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  try {
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations())
    );

    await t.test('completes an in-progress workout', () => {
      const completedAt = 2_000;

      db.insert(workouts)
        .values({
          id: 'in-progress-workout',
          name: 'In Progress',
          status: 'in_progress',
          startedAt: 1_000,
          dateKey: '1970-01-01'
        })
        .run();
      t.mock.method(Date, 'now', () => completedAt);

      completeWorkout(db, 'in-progress-workout');

      const completedWorkout = db
        .select()
        .from(workouts)
        .where(eq(workouts.id, 'in-progress-workout'))
        .get();

      assert.equal(completedWorkout?.status, 'completed');
      assert.equal(completedWorkout?.completedAt, completedAt);
    });

    await t.test('does nothing for a missing workout', () => {
      assert.doesNotThrow(() => completeWorkout(db, 'missing-workout'));
      assert.equal(
        db
          .select()
          .from(workouts)
          .where(eq(workouts.id, 'missing-workout'))
          .get(),
        undefined
      );
    });

    await t.test('does nothing for an already completed workout', () => {
      const existingWorkout = db
        .insert(workouts)
        .values({
          id: 'completed-workout',
          name: 'Completed',
          status: 'completed',
          startedAt: 3_000,
          dateKey: '1970-01-01',
          completedAt: 4_000,
          notes: 'Keep me'
        })
        .returning()
        .get();
      t.mock.method(Date, 'now', () => 5_000);

      completeWorkout(db, 'completed-workout');

      assert.deepEqual(
        db
          .select()
          .from(workouts)
          .where(eq(workouts.id, 'completed-workout'))
          .get(),
        existingWorkout
      );
    });

    await t.test('retains the persisted date key', () => {
      const persistedDateKey = '2025-12-31';

      db.insert(workouts)
        .values({
          id: 'timezone-workout',
          name: 'Timezone Change',
          status: 'in_progress',
          startedAt: Date.UTC(2026, 0, 1, 1),
          dateKey: persistedDateKey
        })
        .run();

      completeWorkout(db, 'timezone-workout');

      assert.equal(
        db
          .select({ dateKey: workouts.dateKey })
          .from(workouts)
          .where(eq(workouts.id, 'timezone-workout'))
          .get()?.dateKey,
        persistedDateKey
      );
    });
  } finally {
    nodeClient.closeSync();
  }
});

test('recent exercises are deduplicated before the limit', async () => {
  const nodeClient = new NodeSQLiteDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  try {
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations())
    );

    db.insert(exercises)
      .values([
        { id: 'exercise-a', name: 'A', category: 'other' },
        { id: 'exercise-b', name: 'B', category: 'other' },
        { id: 'exercise-c', name: 'C', category: 'other' },
        { id: 'exercise-d', name: 'D', category: 'other' },
        { id: 'exercise-archived', name: 'Archived', category: 'other' },
        { id: 'exercise-in-progress', name: 'In Progress', category: 'other' }
      ])
      .run();
    db.update(exercises)
      .set({ isArchived: 1 })
      .where(eq(exercises.id, 'exercise-archived'))
      .run();
    db.insert(workouts)
      .values([
        {
          id: 'workout-in-progress',
          name: 'In Progress',
          status: 'in_progress',
          startedAt: 700,
          dateKey: '1970-01-01'
        },
        {
          id: 'workout-latest',
          name: 'Latest',
          status: 'completed',
          startedAt: 500,
          dateKey: '1970-01-01'
        },
        {
          id: 'workout-repeat',
          name: 'Repeat',
          status: 'completed',
          startedAt: 400,
          dateKey: '1970-01-01'
        },
        {
          id: 'workout-tie-c',
          name: 'Tie C',
          status: 'completed',
          startedAt: 300,
          dateKey: '1970-01-01'
        },
        {
          id: 'workout-tie-d',
          name: 'Tie D',
          status: 'completed',
          startedAt: 300,
          dateKey: '1970-01-01'
        }
      ])
      .run();
    db.insert(workoutExercises)
      .values([
        {
          id: 'usage-in-progress',
          workoutId: 'workout-in-progress',
          exerciseId: 'exercise-in-progress',
          order: 0
        },
        {
          id: 'usage-latest-archived',
          workoutId: 'workout-latest',
          exerciseId: 'exercise-archived',
          order: 0
        },
        {
          id: 'usage-latest-b',
          workoutId: 'workout-latest',
          exerciseId: 'exercise-b',
          order: 1
        },
        {
          id: 'usage-latest-a',
          workoutId: 'workout-latest',
          exerciseId: 'exercise-a',
          order: 2
        },
        {
          id: 'usage-repeat-a',
          workoutId: 'workout-repeat',
          exerciseId: 'exercise-a',
          order: 0
        },
        {
          id: 'usage-repeat-b',
          workoutId: 'workout-repeat',
          exerciseId: 'exercise-b',
          order: 1
        },
        {
          id: 'usage-tie-c',
          workoutId: 'workout-tie-c',
          exerciseId: 'exercise-c',
          order: 0
        },
        {
          id: 'usage-tie-d',
          workoutId: 'workout-tie-d',
          exerciseId: 'exercise-d',
          order: 0
        }
      ])
      .run();

    const recentExercisesQuery = getRecentExerciseIdsQuery(db, [], 4);
    const recentExerciseIds = recentExercisesQuery
      .all()
      .map(row => row.exerciseId);

    assert.deepEqual(
      (
        recentExercisesQuery as unknown as {
          getUsedTables: () => string[];
        }
      )
        .getUsedTables()
        .sort(),
      ['exercises', 'workout_exercises', 'workouts']
    );
    assert.equal(recentExerciseIds.length, 4);
    assert.equal(new Set(recentExerciseIds).size, 4);
    assert.deepEqual(recentExerciseIds, [
      'exercise-b',
      'exercise-a',
      'exercise-c',
      'exercise-d'
    ]);

    assert.deepEqual(
      getRecentExerciseIdsQuery(db, ['exercise-b'], 3)
        .all()
        .map(row => row.exerciseId),
      ['exercise-a', 'exercise-c', 'exercise-d']
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('completed set commands maintain personal records atomically', async t => {
  await t.test('creates a new personal record', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);

      const result = createTrackedSet(db, 'record-set', 12, 1);

      assert.equal(result.set.id, 'record-set');
      assert.equal(result.isNewPersonalRecord, true);
      assert.deepEqual(getPersonalRecordSetIds(db), [
        'baseline-set',
        'record-set'
      ]);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test('creates a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      rejectPersonalRecordRebuilds(nodeClient);

      const result = createTrackedSet(db, 'non-record-set', 8, 1);

      assert.equal(result.set.id, 'non-record-set');
      assert.equal(result.isNewPersonalRecord, false);
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test(
    'does not report a zero score as a personal record',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedTrackedExercise(db);
        db.update(exercises)
          .set({ trackingType: 'weight_reps' })
          .where(eq(exercises.id, 'exercise-1'))
          .run();

        const result = createCompletedSet(db, {
          id: 'zero-score-set',
          workoutExerciseId: 'workout-exercise-1',
          order: 0,
          weightKg: 0,
          reps: 10,
          completedAt: 1
        });

        assert.equal(result.isNewPersonalRecord, false);
        assert.deepEqual(getPersonalRecordSetIds(db), []);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test(
    'rebuilds after editing the current record downward',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedTrackedExercise(db);
        createTrackedSet(db, 'baseline-set', 10, 0);
        createTrackedSet(db, 'record-set', 12, 1);

        const result = updateCompletedSet(db, 'record-set', { reps: 8 });

        assert.equal(result?.set.reps, 8);
        assert.equal(result?.isNewPersonalRecord, false);
        assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test('edits a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      createTrackedSet(db, 'non-record-set', 8, 1);
      rejectPersonalRecordRebuilds(nodeClient);

      const result = updateCompletedSet(db, 'non-record-set', { reps: 9 });

      assert.equal(result?.set.reps, 9);
      assert.equal(result?.isNewPersonalRecord, false);
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test(
    'rebuilds when editing a non-record into the historical record chain',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedTrackedExercise(db);
        createTrackedSet(db, 'baseline-set', 10, 0);
        createTrackedSet(db, 'latest-record-set', 20, 2);
        createTrackedSet(db, 'historical-non-record-set', 8, 1);

        const result = updateCompletedSet(db, 'historical-non-record-set', {
          reps: 15
        });

        assert.equal(result?.isNewPersonalRecord, false);
        assert.deepEqual(getPersonalRecordSetIds(db), [
          'baseline-set',
          'historical-non-record-set',
          'latest-record-set'
        ]);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test('rebuilds after deleting the current record', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      createTrackedSet(db, 'record-set', 12, 1);

      const deletedSet = deleteCompletedSet(db, 'record-set');

      assert.equal(deletedSet?.id, 'record-set');
      assert.equal(
        db.select().from(sets).where(eq(sets.id, 'record-set')).get(),
        undefined
      );
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test('deletes a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      createTrackedSet(db, 'non-record-set', 8, 1);
      rejectPersonalRecordRebuilds(nodeClient);

      const deletedSet = deleteCompletedSet(db, 'non-record-set');

      assert.equal(deletedSet?.id, 'non-record-set');
      assert.equal(
        db.select().from(sets).where(eq(sets.id, 'non-record-set')).get(),
        undefined
      );
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test(
    'rolls back the set mutation when rebuilding fails',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedTrackedExercise(db);
        createTrackedSet(db, 'baseline-set', 10, 0);
        rejectPersonalRecordRebuilds(nodeClient);

        assert.throws(() => createTrackedSet(db, 'record-set', 12, 1));
        assert.equal(
          db.select().from(sets).where(eq(sets.id, 'record-set')).get(),
          undefined
        );
        assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
      } finally {
        nodeClient.closeSync();
      }
    }
  );
});

import {
  exercises,
  personalRecords,
  sets,
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates
} from '@/src/db/schema';
import {
  assertNoExerciseNameMigrationConflicts,
  backfillNormalizedExerciseNames,
  ExerciseNameMigrationConflictError
} from '@/src/db/exercise-name-migration';
import {
  createDrizzleDb,
  runDatabaseMigrations,
  type DrizzleDb
} from '@/src/db/client';
import {
  createExercise,
  ExerciseNameConflictError,
  getExerciseUsageExistsQuery,
  hasExerciseNameConflict,
  removeCustomExercise,
  updateCustomExerciseDetails,
  updateCustomExerciseName
} from '@/src/features/exercises/exercise.repository';
import {
  ActiveWorkoutExerciseDraftConflictError,
  completeWorkout,
  createCompletedSet,
  deleteCompletedSet,
  deleteWorkout,
  getRecentExerciseIdsQuery,
  saveHistoricalWorkoutDraft,
  saveHistoricalWorkoutEditDraft,
  saveActiveWorkoutExerciseDraft,
  updateCompletedSet
} from '@/src/features/workouts/workout.repository';
import {
  saveWorkoutTemplateExerciseDraft,
  WorkoutTemplateExerciseDraftConflictError
} from '@/src/features/workouts/workout-template.repository';
import {
  getExerciseHistoryQuery,
  mapExerciseHistoryRows,
  rebuildPersonalRecordsForExercises
} from '@/src/features/progress/progress.repository';
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
    private readonly database: DatabaseSync,
    private readonly onExecute: () => void
  ) {}

  executeSync(params: SQLInputValue[] = []) {
    return this.execute(params, false);
  }

  executeForRawResultSync(params: SQLInputValue[] = []) {
    return this.execute(params, true);
  }

  private execute(params: SQLInputValue[], rawResult: boolean) {
    this.onExecute();
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
  private executedPreparedStatementCount = 0;

  getPreparedStatementCount() {
    return this.executedPreparedStatementCount;
  }

  resetPreparedStatementCount() {
    this.executedPreparedStatementCount = 0;
  }

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
      this.database,
      () => {
        if (!/^\s*(begin|commit|rollback)\b/i.test(source)) {
          this.executedPreparedStatementCount += 1;
        }
      }
    );
  }

  getFirstSync<T>(source: string): T | null {
    return (this.database.prepare(source).get() as T | undefined) ?? null;
  }

  getAllSync<T>(source: string, params: SQLInputValue[] = []): T[] {
    return this.database.prepare(source).all(...params) as T[];
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
    migrate(db, loadMigrations(11))
  );
  backfillNormalizedExerciseNames(db);
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
      normalizedName: 'push-up',
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

function seedHistoricalExercises(db: DrizzleDb) {
  db.insert(exercises)
    .values([
      {
        id: 'exercise-a',
        name: 'Exercise A',
        normalizedName: 'exercise a',
        category: 'other',
        trackingType: 'reps'
      },
      {
        id: 'exercise-b',
        name: 'Exercise B',
        normalizedName: 'exercise b',
        category: 'other',
        trackingType: 'reps'
      }
    ])
    .run();
}

function insertHistoricalWorkout(
  db: DrizzleDb,
  {
    id,
    status,
    reps,
    sourceWorkoutId
  }: {
    id: string;
    status: string;
    reps: [number, number];
    sourceWorkoutId?: string;
  }
) {
  db.insert(workouts)
    .values({
      id,
      name: id,
      status,
      startedAt: 1_000,
      dateKey: '1970-01-01',
      sourceWorkoutId
    })
    .run();
  db.insert(workoutExercises)
    .values([
      {
        id: `${id}-exercise-a`,
        workoutId: id,
        exerciseId: 'exercise-a',
        order: 0
      },
      {
        id: `${id}-exercise-b`,
        workoutId: id,
        exerciseId: 'exercise-b',
        order: 1
      }
    ])
    .run();
  db.insert(sets)
    .values([
      {
        id: `${id}-set-a`,
        workoutExerciseId: `${id}-exercise-a`,
        order: 0,
        reps: reps[0],
        status: 'completed',
        completedAt: 2_000
      },
      {
        id: `${id}-set-b`,
        workoutExerciseId: `${id}-exercise-b`,
        order: 0,
        reps: reps[1],
        status: 'completed',
        completedAt: 3_000
      }
    ])
    .run();
}

function getHistoricalPersonalRecordRows(db: DrizzleDb) {
  return db
    .select({
      exerciseId: personalRecords.exerciseId,
      setId: personalRecords.setId,
      reps: personalRecords.reps,
      score: personalRecords.score
    })
    .from(personalRecords)
    .orderBy(personalRecords.exerciseId, personalRecords.achievedAt)
    .all();
}

test('exercise usage query checks workout and template references together', async t => {
  const cases = [
    {
      name: 'no usage',
      workoutUsageCount: 0,
      templateUsageCount: 0,
      isUsed: 0
    },
    {
      name: 'workout-only usage',
      workoutUsageCount: 2,
      templateUsageCount: 0,
      isUsed: 1
    },
    {
      name: 'template-only usage',
      workoutUsageCount: 0,
      templateUsageCount: 2,
      isUsed: 1
    },
    {
      name: 'usage in both tables',
      workoutUsageCount: 2,
      templateUsageCount: 3,
      isUsed: 1
    }
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        db.insert(exercises)
          .values({
            id: 'usage-exercise',
            name: 'Usage exercise',
            normalizedName: 'usage exercise',
            category: 'other'
          })
          .run();
        db.insert(workouts)
          .values({
            id: 'usage-workout',
            name: 'Usage workout',
            status: 'completed',
            startedAt: 1,
            dateKey: '1970-01-01'
          })
          .run();
        db.insert(workoutTemplates)
          .values({
            id: 'usage-template',
            name: 'Usage template',
            createdAt: 1,
            updatedAt: 1
          })
          .run();

        if (testCase.workoutUsageCount > 0) {
          db.insert(workoutExercises)
            .values(
              Array.from(
                { length: testCase.workoutUsageCount },
                (_, index) => ({
                  id: `workout-usage-${index}`,
                  workoutId: 'usage-workout',
                  exerciseId: 'usage-exercise',
                  order: index
                })
              )
            )
            .run();
        }

        if (testCase.templateUsageCount > 0) {
          db.insert(workoutTemplateExercises)
            .values(
              Array.from(
                { length: testCase.templateUsageCount },
                (_, index) => ({
                  id: `template-usage-${index}`,
                  templateId: 'usage-template',
                  exerciseId: 'usage-exercise',
                  order: index
                })
              )
            )
            .run();
        }

        const query = getExerciseUsageExistsQuery(db, 'usage-exercise');

        nodeClient.resetPreparedStatementCount();
        assert.deepEqual(query.get(), { isUsed: testCase.isUsed });
        assert.equal(nodeClient.getPreparedStatementCount(), 1);

        const generatedQuery = query.toSQL();
        const queryPlan = nodeClient.getAllSync<{ detail: string }>(
          `EXPLAIN QUERY PLAN ${generatedQuery.sql}`,
          generatedQuery.params as SQLInputValue[]
        );
        const queryPlanDetails = queryPlan.map(row => row.detail).join('\n');

        assert.match(
          queryPlanDetails,
          /workout_exercises_exercise_id_workout_id_idx/
        );
        assert.match(
          queryPlanDetails,
          /workout_template_exercises_exercise_id_template_id_idx/
        );
      } finally {
        nodeClient.closeSync();
      }
    });
  }
});

test('custom exercise updates use reduced statement paths', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    db.insert(exercises)
      .values([
        {
          id: 'custom-exercise',
          name: 'Custom exercise',
          normalizedName: 'custom exercise',
          category: 'other',
          trackingType: 'reps',
          isCustom: 1
        },
        {
          id: 'built-in-exercise',
          name: 'Built-in exercise',
          normalizedName: 'built-in exercise',
          category: 'other',
          trackingType: 'reps'
        }
      ])
      .run();

    nodeClient.resetPreparedStatementCount();
    assert.equal(
      updateCustomExerciseName(db, 'custom-exercise', 'Renamed')?.name,
      'Renamed'
    );
    assert.equal(nodeClient.getPreparedStatementCount(), 1);

    nodeClient.resetPreparedStatementCount();
    assert.equal(
      updateCustomExerciseName(db, 'built-in-exercise', 'Blocked'),
      undefined
    );
    assert.equal(nodeClient.getPreparedStatementCount(), 1);

    nodeClient.resetPreparedStatementCount();
    assert.equal(
      updateCustomExerciseDetails(db, 'custom-exercise', {
        category: 'arms',
        trackingType: 'reps',
        primaryMuscles: ['biceps'],
        secondaryMuscles: []
      })?.category,
      'arms'
    );
    assert.equal(nodeClient.getPreparedStatementCount(), 2);

    nodeClient.resetPreparedStatementCount();
    assert.equal(
      updateCustomExerciseDetails(db, 'custom-exercise', {
        category: 'cardio',
        trackingType: 'duration',
        primaryMuscles: [],
        secondaryMuscles: []
      })?.trackingType,
      'duration'
    );
    assert.equal(nodeClient.getPreparedStatementCount(), 4);
  } finally {
    nodeClient.closeSync();
  }
});

test('exercise name migration reports active normalized duplicates before schema changes', async () => {
  const nodeClient = new NodeSQLiteDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  try {
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations(10))
    );
    nodeClient.execSync(`
      INSERT INTO exercises (id, name, category, is_archived, created_at)
      VALUES
        ('duplicate-a', ' ÜBUNG ', 'other', 0, 1),
        ('duplicate-b', 'übung', 'other', 0, 1),
        ('archived-duplicate', 'Übung', 'other', 1, 1);
    `);

    await assert.rejects(
      assertNoExerciseNameMigrationConflicts(sqliteClient),
      error => {
        assert.ok(error instanceof ExerciseNameMigrationConflictError);
        assert.deepEqual(error.conflicts, [
          {
            normalizedName: 'übung',
            exercises: [
              { id: 'duplicate-a', name: ' ÜBUNG ' },
              { id: 'duplicate-b', name: 'übung' }
            ]
          }
        ]);

        return true;
      }
    );
    assert.equal(
      nodeClient
        .getAllSync<{ name: string }>("PRAGMA table_info('exercises')")
        .some(column => column.name === 'normalized_name'),
      false
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('exercise name migration backfills Unicode normalized names', async () => {
  const nodeClient = new NodeSQLiteDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  try {
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations(10))
    );
    nodeClient.execSync(`
      INSERT INTO exercises (id, name, category, is_archived, created_at)
      VALUES
        ('active', ' ÜBUNG ', 'other', 0, 1),
        ('archived', 'Übung', 'other', 1, 1);
    `);

    await assertNoExerciseNameMigrationConflicts(sqliteClient);
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations(11))
    );
    backfillNormalizedExerciseNames(db);
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations())
    );

    assert.deepEqual(
      db
        .select({
          id: exercises.id,
          normalizedName: exercises.normalizedName
        })
        .from(exercises)
        .all(),
      [
        { id: 'active', normalizedName: 'übung' },
        { id: 'archived', normalizedName: 'übung' }
      ]
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('exercise name writes enforce and translate active normalized conflicts', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    const created = createExercise(db, {
      id: 'unicode-name',
      name: ' ÜBUNG ',
      category: 'other'
    });

    assert.equal(created.normalizedName, 'übung');
    assert.equal(hasExerciseNameConflict(db, undefined, 'übung'), true);
    assert.equal(hasExerciseNameConflict(db, created.id, '  ÜBUNG  '), false);
    assert.throws(
      () =>
        createExercise(db, {
          id: 'duplicate-name',
          name: 'übung',
          category: 'other'
        }),
      ExerciseNameConflictError
    );
    assert.throws(
      () =>
        nodeClient.execSync(`
          INSERT INTO exercises (id, name, category, created_at)
          VALUES ('missing-normalized-name', 'Missing', 'other', 1);
        `),
      /NOT NULL constraint failed: exercises.normalized_name/
    );

    createExercise(db, {
      id: 'rename-target',
      name: 'Different',
      category: 'other'
    });
    assert.throws(
      () => updateCustomExerciseName(db, 'rename-target', 'Übung'),
      ExerciseNameConflictError
    );
    assert.doesNotThrow(() =>
      db
        .insert(exercises)
        .values({
          id: 'archived-name',
          name: 'übung',
          normalizedName: 'übung',
          category: 'other',
          isArchived: 1
        })
        .run()
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('staged exercise saves report normalized name conflicts', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    createExercise(db, {
      id: 'existing-exercise',
      name: 'Übung',
      category: 'other'
    });
    db.insert(workouts)
      .values({
        id: 'active-workout',
        name: 'Active',
        status: 'in_progress',
        startedAt: 1,
        dateKey: '1970-01-01'
      })
      .run();
    db.insert(workoutTemplates)
      .values({
        id: 'template',
        name: 'Template',
        createdAt: 1,
        updatedAt: 1
      })
      .run();
    const stagedExercise = {
      id: 'staged-exercise',
      name: ' üBUNG ',
      normalizedName: 'übung',
      category: 'other',
      trackingType: 'weight_reps',
      primaryMuscles: '[]',
      secondaryMuscles: '[]',
      isCustom: 1,
      isArchived: 0,
      createdAt: 1
    };

    assert.throws(
      () =>
        saveActiveWorkoutExerciseDraft(
          db,
          'active-workout',
          [
            {
              id: 'workout-exercise',
              exerciseId: stagedExercise.id,
              supersetId: null
            }
          ],
          [],
          [stagedExercise]
        ),
      ActiveWorkoutExerciseDraftConflictError
    );
    assert.throws(
      () =>
        saveWorkoutTemplateExerciseDraft(
          db,
          'template',
          [
            {
              id: 'template-exercise',
              exerciseId: stagedExercise.id,
              supersetId: null
            }
          ],
          [],
          [stagedExercise]
        ),
      WorkoutTemplateExerciseDraftConflictError
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('tracking-type update rolls back when personal-record rebuild fails', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    seedTrackedExercise(db);
    db.update(exercises)
      .set({ isCustom: 1 })
      .where(eq(exercises.id, 'exercise-1'))
      .run();
    createTrackedSet(db, 'set-1', 10, 0);
    rejectPersonalRecordRebuilds(nodeClient);

    assert.throws(
      () =>
        updateCustomExerciseDetails(db, 'exercise-1', {
          category: 'cardio',
          trackingType: 'duration',
          primaryMuscles: [],
          secondaryMuscles: []
        }),
      /unexpected personal record rebuild/
    );

    assert.deepEqual(
      db
        .select({
          category: exercises.category,
          trackingType: exercises.trackingType
        })
        .from(exercises)
        .where(eq(exercises.id, 'exercise-1'))
        .get(),
      { category: 'chest', trackingType: 'reps' }
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('custom exercise removal preserves results with three-statement paths', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    db.insert(exercises)
      .values([
        {
          id: 'unused-custom',
          name: 'Unused custom',
          normalizedName: 'unused custom',
          category: 'other',
          isCustom: 1
        },
        {
          id: 'referenced-custom',
          name: 'Referenced custom',
          normalizedName: 'referenced custom',
          category: 'other',
          isCustom: 1
        },
        {
          id: 'built-in',
          name: 'Built-in',
          normalizedName: 'built-in',
          category: 'other'
        }
      ])
      .run();
    db.insert(workouts)
      .values({
        id: 'removal-workout',
        name: 'Removal workout',
        status: 'completed',
        startedAt: 1,
        dateKey: '1970-01-01'
      })
      .run();
    db.insert(workoutExercises)
      .values({
        id: 'removal-workout-exercise',
        workoutId: 'removal-workout',
        exerciseId: 'referenced-custom',
        order: 0
      })
      .run();

    nodeClient.resetPreparedStatementCount();
    assert.equal(removeCustomExercise(db, 'missing'), 'not_found');
    assert.equal(nodeClient.getPreparedStatementCount(), 1);

    nodeClient.resetPreparedStatementCount();
    assert.equal(removeCustomExercise(db, 'built-in'), 'not_custom');
    assert.equal(nodeClient.getPreparedStatementCount(), 1);

    nodeClient.resetPreparedStatementCount();
    assert.equal(removeCustomExercise(db, 'referenced-custom'), 'archived');
    assert.equal(nodeClient.getPreparedStatementCount(), 3);

    nodeClient.resetPreparedStatementCount();
    assert.equal(removeCustomExercise(db, 'unused-custom'), 'deleted');
    assert.equal(nodeClient.getPreparedStatementCount(), 3);
  } finally {
    nodeClient.closeSync();
  }
});

test('custom exercise removal archives after a defensive delete fallback', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    db.insert(exercises)
      .values({
        id: 'fallback-custom',
        name: 'Fallback custom',
        normalizedName: 'fallback custom',
        category: 'other',
        isCustom: 1
      })
      .run();
    nodeClient.execSync(`
      CREATE TRIGGER reject_custom_exercise_delete
      BEFORE DELETE ON exercises
      WHEN OLD.id = 'fallback-custom'
      BEGIN
        SELECT RAISE(ABORT, 'FOREIGN KEY constraint failed');
      END;
    `);

    const originalConsoleError = console.error;
    console.error = () => undefined;
    nodeClient.resetPreparedStatementCount();

    try {
      assert.equal(removeCustomExercise(db, 'fallback-custom'), 'archived');
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(nodeClient.getPreparedStatementCount(), 4);
    assert.equal(
      db
        .select({ isArchived: exercises.isArchived })
        .from(exercises)
        .where(eq(exercises.id, 'fallback-custom'))
        .get()?.isArchived,
      1
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('production initialization enables workout delete foreign-key actions', async () => {
  const nodeClient = new NodeSQLiteDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  try {
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations(9))
    );

    nodeClient.execSync(`
      INSERT INTO exercises (id, name, category, created_at)
      VALUES ('exercise-1', 'Squat', 'legs', 1);
    `);
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
      migrate(db, loadMigrations(11))
    );
    backfillNormalizedExerciseNames(db);
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
        {
          id: 'exercise-a',
          name: 'A',
          normalizedName: 'a',
          category: 'other'
        },
        {
          id: 'exercise-b',
          name: 'B',
          normalizedName: 'b',
          category: 'other'
        },
        {
          id: 'exercise-c',
          name: 'C',
          normalizedName: 'c',
          category: 'other'
        },
        {
          id: 'exercise-d',
          name: 'D',
          normalizedName: 'd',
          category: 'other'
        },
        {
          id: 'exercise-archived',
          name: 'Archived',
          normalizedName: 'archived',
          category: 'other'
        },
        {
          id: 'exercise-in-progress',
          name: 'In Progress',
          normalizedName: 'in progress',
          category: 'other'
        }
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

test('exercise history selects workouts and sets by completed sets', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    db.insert(exercises)
      .values({
        id: 'exercise-history',
        name: 'History exercise',
        normalizedName: 'history exercise',
        category: 'other'
      })
      .run();
    db.insert(workouts)
      .values([
        {
          id: 'pending-only',
          name: 'Pending only',
          status: 'completed',
          startedAt: 500,
          dateKey: '1970-01-01'
        },
        {
          id: 'mixed',
          name: 'Mixed',
          status: 'completed',
          startedAt: 400,
          dateKey: '1970-01-01'
        },
        {
          id: 'completed',
          name: 'Completed',
          status: 'completed',
          startedAt: 300,
          dateKey: '1970-01-01'
        },
        {
          id: 'probe',
          name: 'Probe',
          status: 'completed',
          startedAt: 200,
          dateKey: '1970-01-01'
        }
      ])
      .run();
    db.insert(workoutExercises)
      .values(
        ['pending-only', 'mixed', 'completed', 'probe'].map(workoutId => ({
          id: `${workoutId}-exercise`,
          workoutId,
          exerciseId: 'exercise-history',
          order: 0
        }))
      )
      .run();
    db.insert(sets)
      .values([
        {
          id: 'pending-only-set',
          workoutExerciseId: 'pending-only-exercise',
          order: 0,
          status: 'pending'
        },
        {
          id: 'mixed-pending',
          workoutExerciseId: 'mixed-exercise',
          order: 0,
          status: 'pending'
        },
        {
          id: 'mixed-completed-1',
          workoutExerciseId: 'mixed-exercise',
          order: 1,
          status: 'completed'
        },
        {
          id: 'mixed-completed-2',
          workoutExerciseId: 'mixed-exercise',
          order: 2,
          status: 'completed'
        },
        {
          id: 'completed-set-1',
          workoutExerciseId: 'completed-exercise',
          order: 0,
          status: 'completed'
        },
        {
          id: 'completed-set-2',
          workoutExerciseId: 'completed-exercise',
          order: 1,
          status: 'completed'
        },
        {
          id: 'probe-set',
          workoutExerciseId: 'probe-exercise',
          order: 0,
          status: 'completed'
        }
      ])
      .run();

    const query = getExerciseHistoryQuery(db, 'exercise-history', 2, {
      includeLimitProbe: true,
      includeProgression: true
    });
    // Node SQLite object rows collapse duplicate join column names.
    nodeClient.execSync(`
      PRAGMA short_column_names = OFF;
      PRAGMA full_column_names = ON;
    `);
    const mapped = mapExerciseHistoryRows(query.all());
    nodeClient.execSync(`
      PRAGMA full_column_names = OFF;
      PRAGMA short_column_names = ON;
    `);

    assert.deepEqual(
      mapped.visibleWorkoutRows.map(row => row.workout.id),
      ['mixed', 'completed', 'probe']
    );
    assert.deepEqual(
      mapped.progressionWorkoutRows.map(row => row.workout.id),
      ['mixed', 'completed', 'probe']
    );
    assert.deepEqual(
      mapped.setRows.map(row => [row.workoutId, row.set.id]),
      [
        ['mixed', 'mixed-completed-1'],
        ['mixed', 'mixed-completed-2'],
        ['completed', 'completed-set-1'],
        ['completed', 'completed-set-2'],
        ['probe', 'probe-set']
      ]
    );
    assert.ok(mapped.setRows.every(row => row.set.status === 'completed'));

    const generatedQuery = query.toSQL();
    const queryPlan = nodeClient.getAllSync<{ detail: string }>(
      `EXPLAIN QUERY PLAN ${generatedQuery.sql}`,
      generatedQuery.params as SQLInputValue[]
    );
    const queryPlanDetails = queryPlan.map(row => row.detail).join('\n');

    assert.match(
      queryPlanDetails,
      /workout_exercises_exercise_id_workout_id_idx/
    );
    assert.match(queryPlanDetails, /sets_workout_exercise_id_status_order_idx/);
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

test('historical saves rebuild records for all affected exercises', async t => {
  await t.test(
    'saves a historical draft with and without new records',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedHistoricalExercises(db);
        insertHistoricalWorkout(db, {
          id: 'historical-draft',
          status: 'historical_draft',
          reps: [10, 0]
        });
        db.insert(personalRecords)
          .values([
            {
              id: 'stale-record-a',
              exerciseId: 'exercise-a',
              setId: 'historical-draft-set-a',
              trackingType: 'reps',
              score: 999,
              reps: 999,
              estimated1rm: 0,
              achievedAt: 1
            },
            {
              id: 'stale-record-b',
              exerciseId: 'exercise-b',
              setId: 'historical-draft-set-b',
              trackingType: 'reps',
              score: 999,
              reps: 999,
              estimated1rm: 0,
              achievedAt: 1
            }
          ])
          .run();

        const result = saveHistoricalWorkoutDraft(db, 'historical-draft');

        assert.equal(result?.workout.id, 'historical-draft');
        assert.equal(result?.workout.status, 'completed');
        assert.deepEqual(result?.affectedExerciseIds, [
          'exercise-a',
          'exercise-b'
        ]);
        assert.deepEqual(getHistoricalPersonalRecordRows(db), [
          {
            exerciseId: 'exercise-a',
            setId: 'historical-draft-set-a',
            reps: 10,
            score: 10
          }
        ]);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test(
    'saves a historical edit with and without replacement records',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedHistoricalExercises(db);
        insertHistoricalWorkout(db, {
          id: 'source-workout',
          status: 'completed',
          reps: [5, 5]
        });
        insertHistoricalWorkout(db, {
          id: 'edit-draft',
          status: 'historical_edit_draft',
          reps: [10, 0],
          sourceWorkoutId: 'source-workout'
        });
        rebuildPersonalRecordsForExercises(db, [
          'exercise-a',
          'exercise-b',
          'exercise-a'
        ]);

        const result = saveHistoricalWorkoutEditDraft(db, {
          sourceWorkoutId: 'source-workout',
          draftWorkoutId: 'edit-draft'
        });

        assert.equal(result?.workout.id, 'source-workout');
        assert.deepEqual(result?.affectedExerciseIds, [
          'exercise-a',
          'exercise-b'
        ]);
        assert.deepEqual(
          getHistoricalPersonalRecordRows(db).map(record => ({
            exerciseId: record.exerciseId,
            reps: record.reps,
            score: record.score
          })),
          [{ exerciseId: 'exercise-a', reps: 10, score: 10 }]
        );
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test('preserves set order when record timestamps tie', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedHistoricalExercises(db);
      insertHistoricalWorkout(db, {
        id: 'a-later-set',
        status: 'completed',
        reps: [20, 0]
      });
      insertHistoricalWorkout(db, {
        id: 'z-earlier-set',
        status: 'completed',
        reps: [10, 0]
      });
      db.update(sets)
        .set({ order: 1 })
        .where(eq(sets.id, 'a-later-set-set-a'))
        .run();

      rebuildPersonalRecordsForExercises(db, ['exercise-a']);

      assert.deepEqual(
        getHistoricalPersonalRecordRows(db).map(record => ({
          setId: record.setId,
          reps: record.reps
        })),
        [
          { setId: 'z-earlier-set-set-a', reps: 10 },
          { setId: 'a-later-set-set-a', reps: 20 }
        ]
      );
    } finally {
      nodeClient.closeSync();
    }
  });
});

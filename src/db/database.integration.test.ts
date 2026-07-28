import {
  exercises,
  sets,
  workoutExercises,
  workouts,
  workoutTemplates
} from '@/src/db/schema';
import { createDrizzleDb, runDatabaseMigrations } from '@/src/db/client';
import {
  completeWorkout,
  deleteWorkout
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

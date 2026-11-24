import {
  sets,
  workoutExercises,
  workouts,
  workoutTemplates
} from '@/src/db/schema';
import {
  backfillExerciseEquipment,
  backfillNormalizedExerciseNames
} from '@/src/db/exercise-name-migration';
import { createDrizzleDb, runDatabaseMigrations } from '@/src/db/client';
import { cleanupLegacyHistoricalWorkoutEditDrafts } from '@/src/features/workouts/shared/workout.repository';
import { deleteWorkout } from '@/src/features/workouts/active/active.repository';
import { eq } from 'drizzle-orm';
import type { SQLiteDatabase } from 'expo-sqlite';
import assert from 'node:assert/strict';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import test, { afterEach } from 'node:test';
import {
  closeTestDatabases,
  createTestDatabase,
  loadMigrations
} from '@/tests/support/db';

interface ForeignKeyListRow {
  table: string;
  from: string;
  on_delete: string;
}

afterEach(closeTestDatabases);

test('production initialization enables workout delete foreign-key actions', async () => {
  const nodeClient = createTestDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(9))
  );

  nodeClient.execSync(`
    INSERT INTO exercises (id, name, category, created_at)
    VALUES ('exercise-1', 'Squat', 'legs', 1);
  `);
  nodeClient.execSync(`
    INSERT INTO workouts (id, name, status, started_at, date_key)
    VALUES ('workout-1', 'Leg Day', 'completed', 1, '1970-01-01');
    INSERT INTO workout_templates (
      id, name, source_workout_id, created_at, updated_at
    ) VALUES ('template-1', 'Leg Template', 'workout-1', 1, 1);
    INSERT INTO workout_exercises (
      id, workout_id, exercise_id, "order"
    ) VALUES ('workout-exercise-1', 'workout-1', 'exercise-1', 0);
    INSERT INTO sets (id, workout_exercise_id, "order")
    VALUES ('set-1', 'workout-exercise-1', 0);
  `);

  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(11))
  );
  backfillNormalizedExerciseNames(db);
  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(14))
  );
  await backfillExerciseEquipment(sqliteClient);
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
    workoutExerciseForeignKeys.find(row => row.table === 'workouts')?.on_delete,
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
});

test('production initialization removes incompatible historical edit drafts', async () => {
  const nodeClient = createTestDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(11))
  );
  backfillNormalizedExerciseNames(db);
  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(12))
  );

  nodeClient.execSync(`
    INSERT INTO exercises (
      id, name, normalized_name, category, created_at
    ) VALUES ('exercise-1', 'Squat', 'squat', 'legs', 1);
    INSERT INTO workouts (id, name, status, started_at, date_key)
    VALUES ('source-workout', 'Leg Day', 'completed', 1, '1970-01-01');
    INSERT INTO workouts (
      id, name, status, started_at, date_key, source_workout_id
    ) VALUES (
      'legacy-draft', 'Leg Day', 'historical_edit_draft', 1,
      '1970-01-01', 'source-workout'
    );
    INSERT INTO workout_exercises (
      id, workout_id, exercise_id, "order"
    ) VALUES ('legacy-draft-exercise', 'legacy-draft', 'exercise-1', 0);
    INSERT INTO sets (id, workout_exercise_id, "order")
    VALUES ('legacy-draft-set', 'legacy-draft-exercise', 0);
  `);

  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(14))
  );
  await backfillExerciseEquipment(sqliteClient);
  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations())
  );
  db.insert(workouts)
    .values({
      id: 'current-draft',
      name: 'Leg Day',
      status: 'historical_edit_draft',
      startedAt: 1,
      dateKey: '1970-01-01',
      sourceSnapshot: '{}',
      sourceWorkoutId: 'source-workout'
    })
    .run();
  cleanupLegacyHistoricalWorkoutEditDrafts(db);

  assert.ok(
    db.select().from(workouts).where(eq(workouts.id, 'source-workout')).get()
  );
  assert.equal(
    db.select().from(workouts).where(eq(workouts.id, 'legacy-draft')).get(),
    undefined
  );
  assert.ok(
    db.select().from(workouts).where(eq(workouts.id, 'current-draft')).get()
  );
  assert.equal(
    db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.id, 'legacy-draft-exercise'))
      .get(),
    undefined
  );
  assert.equal(
    db.select().from(sets).where(eq(sets.id, 'legacy-draft-set')).get(),
    undefined
  );
});

import { exercises } from '@/src/db/schema';
import {
  assertNoExerciseNameMigrationConflicts,
  backfillExerciseEquipment,
  backfillNormalizedExerciseNames,
  ExerciseNameMigrationConflictError,
  hasExerciseEquipmentColumn
} from '@/src/db/exercise-name-migration';
import { createDrizzleDb, runDatabaseMigrations } from '@/src/db/client';
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

afterEach(closeTestDatabases);

test('exercise name migration reports active normalized duplicates before schema changes', async () => {
  const nodeClient = createTestDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

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
});

test('exercise name migration backfills Unicode normalized names', async () => {
  const nodeClient = createTestDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

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
    migrate(db, loadMigrations(14))
  );
  await backfillExerciseEquipment(sqliteClient);
  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations())
  );

  assert.deepEqual(
    db
      .select({
        id: exercises.id,
        normalizedName: exercises.normalizedName,
        equipment: exercises.equipment
      })
      .from(exercises)
      .all(),
    [
      { id: 'active', normalizedName: 'übung', equipment: 'other' },
      { id: 'archived', normalizedName: 'übung', equipment: 'other' }
    ]
  );
});

test('database migration resumes when equipment already exists', async () => {
  const nodeClient = createTestDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(13))
  );
  nodeClient.execSync(`
    ALTER TABLE exercises ADD equipment text;
    INSERT INTO exercises (
      id, name, normalized_name, category, equipment, created_at
    ) VALUES ('legacy-equipment', 'Squat', 'squat', 'legs', NULL, 1);
  `);

  assert.equal(await hasExerciseEquipmentColumn(sqliteClient), true);

  const allMigrations = loadMigrations();
  const migrationsThroughExistingEquipmentColumn = {
    ...allMigrations,
    journal: {
      entries: allMigrations.journal.entries.filter(entry => entry.idx <= 13)
    }
  };
  const migrationsAfterExistingEquipmentColumn = {
    ...allMigrations,
    journal: {
      entries: allMigrations.journal.entries.filter(entry => entry.idx !== 14)
    }
  };

  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, migrationsThroughExistingEquipmentColumn)
  );
  await backfillExerciseEquipment(sqliteClient);
  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, migrationsAfterExistingEquipmentColumn)
  );

  assert.equal(
    db
      .select({ equipment: exercises.equipment })
      .from(exercises)
      .where(eq(exercises.id, 'legacy-equipment'))
      .get()?.equipment,
    'legs'
  );
  assert.equal(
    nodeClient
      .getAllSync<{ name: string }>("PRAGMA table_info('exercises')")
      .some(column => column.name === 'category'),
    false
  );
});

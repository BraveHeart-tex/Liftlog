import type { DrizzleDb } from '@/src/db/client';
import { workoutExercises, workouts } from '@/src/db/schema';
import {
  closeTestDatabases,
  createMigratedTestDatabase,
  loadMigrations
} from '@/tests/support/db';

// Runs the shared tests/support real-SQLite harness under Jest.
// Catches a Jest environment that cannot load node:sqlite, run Drizzle migrations,
// enforce foreign keys or roll back a failed transaction.

function insertWorkout(db: DrizzleDb, id: string) {
  db.insert(workouts)
    .values({
      id,
      name: 'Workout',
      status: 'in_progress',
      startedAt: 1,
      dateKey: '1970-01-01'
    })
    .run();
}

test('node:sqlite runs every migration, enforces foreign keys, rolls back and closes', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    const applied = nodeClient.getAllSync<{ hash: string }>(
      'SELECT hash FROM __drizzle_migrations'
    );
    expect(applied).toHaveLength(loadMigrations().journal.entries.length);

    expect(
      nodeClient.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys')
    ).toEqual({ foreign_keys: 1 });
    expect(() =>
      db
        .insert(workoutExercises)
        .values({
          id: 'orphan',
          workoutId: 'missing-workout',
          exerciseId: 'missing-exercise',
          order: 0
        })
        .run()
    ).toThrow(/FOREIGN KEY constraint failed/);

    expect(() =>
      db.transaction(tx => {
        insertWorkout(tx, 'rolled-back-workout');

        throw new Error('abort transaction');
      })
    ).toThrow('abort transaction');
    expect(db.select().from(workouts).all()).toEqual([]);
  } finally {
    closeTestDatabases();
  }

  expect(nodeClient.isOpen).toBe(false);
});

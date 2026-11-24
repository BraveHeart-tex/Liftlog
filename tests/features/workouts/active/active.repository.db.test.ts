import { workouts } from '@/src/db/schema';
import { completeWorkout } from '@/src/features/workouts/active/active.repository';
import { eq } from 'drizzle-orm';
import assert from 'node:assert/strict';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';

afterEach(closeTestDatabases);
afterEach(() => {
  jest.restoreAllMocks();
});

describe('completeWorkout conditionally completes in-progress workouts', () => {
  test('completes an in-progress workout', async () => {
    const { db } = await createMigratedTestDatabase();

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
    jest.spyOn(Date, 'now').mockImplementation(() => completedAt);

    completeWorkout(db, 'in-progress-workout');

    const completedWorkout = db
      .select()
      .from(workouts)
      .where(eq(workouts.id, 'in-progress-workout'))
      .get();

    assert.equal(completedWorkout?.status, 'completed');
    assert.equal(completedWorkout?.completedAt, completedAt);
  });

  test('does nothing for a missing workout', async () => {
    const { db } = await createMigratedTestDatabase();

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

  test('does nothing for an already completed workout', async () => {
    const { db } = await createMigratedTestDatabase();

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
    jest.spyOn(Date, 'now').mockImplementation(() => 5_000);

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

  test('retains the persisted date key', async () => {
    const { db } = await createMigratedTestDatabase();

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
});

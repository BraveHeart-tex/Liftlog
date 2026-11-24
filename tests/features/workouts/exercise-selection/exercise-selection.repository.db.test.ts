import { exercises, workoutExercises, workouts } from '@/src/db/schema';
import { getRecentExerciseIdsQuery } from '@/src/features/workouts/exercise-selection/exercise-selection.repository';
import { eq } from 'drizzle-orm';
import assert from 'node:assert/strict';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';

afterEach(closeTestDatabases);

test('recent exercises are deduplicated before the limit', async () => {
  const { db } = await createMigratedTestDatabase();

  db.insert(exercises)
    .values([
      {
        id: 'exercise-a',
        name: 'A',
        normalizedName: 'a',
        equipment: 'other'
      },
      {
        id: 'exercise-b',
        name: 'B',
        normalizedName: 'b',
        equipment: 'other'
      },
      {
        id: 'exercise-c',
        name: 'C',
        normalizedName: 'c',
        equipment: 'other'
      },
      {
        id: 'exercise-d',
        name: 'D',
        normalizedName: 'd',
        equipment: 'other'
      },
      {
        id: 'exercise-archived',
        name: 'Archived',
        normalizedName: 'archived',
        equipment: 'other'
      },
      {
        id: 'exercise-in-progress',
        name: 'In Progress',
        normalizedName: 'in progress',
        equipment: 'other'
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
});

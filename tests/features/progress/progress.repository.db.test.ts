import { exercises, sets, workoutExercises, workouts } from '@/src/db/schema';
import {
  getExerciseHistoryQuery,
  mapExerciseHistoryRows
} from '@/src/features/progress/progress.repository';
import assert from 'node:assert/strict';
import type { SQLInputValue } from 'node:sqlite';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';

afterEach(closeTestDatabases);

test('performance contract: exercise history selects workouts and sets by completed sets through the exercise and set-status indexes', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  db.insert(exercises)
    .values({
      id: 'exercise-history',
      name: 'History exercise',
      normalizedName: 'history exercise',
      equipment: 'other'
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
});

test('exercise history limits workouts, not set rows, and loads no sets for the limit probe', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();
  const workoutIds = ['newest', 'middle', 'probe'];

  db.insert(exercises)
    .values({
      id: 'exercise-history',
      name: 'History exercise',
      normalizedName: 'history exercise',
      equipment: 'other'
    })
    .run();
  db.insert(workouts)
    .values(
      workoutIds.map((id, index) => ({
        id,
        name: id,
        status: 'completed' as const,
        startedAt: 300 - index * 100,
        dateKey: '1970-01-01'
      }))
    )
    .run();
  db.insert(workoutExercises)
    .values(
      workoutIds.map(workoutId => ({
        id: `${workoutId}-exercise`,
        workoutId,
        exerciseId: 'exercise-history',
        order: 0
      }))
    )
    .run();
  db.insert(sets)
    .values(
      workoutIds.flatMap(workoutId =>
        [0, 1, 2, 3].map(order => ({
          id: `${workoutId}-set-${order}`,
          workoutExerciseId: `${workoutId}-exercise`,
          order,
          status: 'completed' as const
        }))
      )
    )
    .run();

  const query = getExerciseHistoryQuery(db, 'exercise-history', 2, {
    includeLimitProbe: true
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

  expect(mapped.visibleWorkoutRows.map(row => row.workout.id)).toEqual(
    workoutIds
  );
  expect(mapped.setRows.map(row => row.set.id)).toEqual([
    'newest-set-0',
    'newest-set-1',
    'newest-set-2',
    'newest-set-3',
    'middle-set-0',
    'middle-set-1',
    'middle-set-2',
    'middle-set-3'
  ]);
});

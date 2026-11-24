import type { Set as WorkoutSet, Workout } from '@/src/db/schema';
import {
  buildExerciseHistory,
  mapExerciseHistoryRows
} from '@/src/features/progress/progress.repository';
import assert from 'node:assert/strict';

function createWorkout(id: string, startedAt: number): Workout {
  return {
    id,
    name: 'Workout',
    status: 'completed',
    startedAt,
    dateKey: '2026-07-28',
    completedAt: startedAt + 1,
    notes: null,
    sourceSnapshot: null,
    sourceWorkoutId: null
  };
}

function createSet(
  id: string,
  workoutExerciseId: string,
  status: WorkoutSet['status'] = 'completed'
): WorkoutSet {
  return {
    id,
    workoutExerciseId,
    order: 1,
    weightKg: 50,
    reps: 8,
    distanceMeters: null,
    durationMs: null,
    durationSeconds: null,
    rpe: null,
    status,
    completedAt: status === 'completed' ? 2 : null,
    sourceSetId: null
  };
}

test('maps joined history rows without dropping duplicate exercise sets', () => {
  const workout1 = createWorkout('workout-1', 3);
  const workout2 = createWorkout('workout-2', 2);
  const workout3 = createWorkout('workout-3', 1);
  const completedSet = createSet('set-1', 'workout-exercise-1');
  const secondCompletedSet = createSet('set-2', 'workout-exercise-1');

  const rows: Parameters<typeof mapExerciseHistoryRows>[0] = [
    {
      workout: workout1,
      set: completedSet,
      isVisible: 1,
      isProgression: 1
    },
    {
      workout: workout1,
      set: secondCompletedSet,
      isVisible: 1,
      isProgression: 1
    },
    {
      workout: workout2,
      set: null,
      isVisible: 1,
      isProgression: 1
    },
    {
      workout: workout3,
      set: null,
      isVisible: 0,
      isProgression: 1
    }
  ];

  const mapped = mapExerciseHistoryRows(rows);

  assert.deepEqual(
    mapped.visibleWorkoutRows.map(row => row.workout.id),
    ['workout-1', 'workout-2']
  );
  assert.deepEqual(
    mapped.progressionWorkoutRows.map(row => row.workout.id),
    ['workout-1', 'workout-2', 'workout-3']
  );
  assert.deepEqual(
    mapped.setRows.map(row => [row.workoutId, row.set.id, row.set.status]),
    [
      ['workout-1', 'set-1', 'completed'],
      ['workout-1', 'set-2', 'completed']
    ]
  );

  const history = buildExerciseHistory(
    mapped.visibleWorkoutRows,
    mapped.setRows
  );

  assert.equal(history.length, 2);
  assert.deepEqual(
    history[0]?.sets.map(set => set.id),
    ['set-1', 'set-2']
  );
  assert.deepEqual(history[1]?.sets, []);
});

test('visible history can retain a limit-plus-one probe separately from the page', () => {
  const rows = [1, 2, 3].map(index => ({
    workout: createWorkout(`workout-${index}`, 4 - index),
    set: null,
    isVisible: 1,
    isProgression: 0
  }));

  const mapped = mapExerciseHistoryRows(rows);
  const visibleLimit = 2;

  assert.equal(mapped.visibleWorkoutRows.length, visibleLimit + 1);
  assert.deepEqual(
    mapped.visibleWorkoutRows.slice(0, visibleLimit).map(row => row.workout.id),
    ['workout-1', 'workout-2']
  );
});

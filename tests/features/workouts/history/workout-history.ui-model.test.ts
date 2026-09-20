import type { Exercise, Set, Workout, WorkoutExercise } from '@/src/db/schema';
import {
  mapWorkoutHistoryDetailUiModel,
  mapWorkoutLogItems,
  mapWorkoutLogTemplates
} from '@/src/features/workouts/history/workout-history.ui-model';
import assert from 'node:assert/strict';
import test from 'node:test';

const startedAt = new Date(2026, 8, 20, 10, 0).getTime();

const workout: Workout = {
  id: 'workout-1',
  name: 'Push day',
  status: 'completed',
  startedAt,
  dateKey: '2026-09-20',
  completedAt: startedAt + 45 * 60_000,
  notes: null,
  sourceSnapshot: null,
  sourceWorkoutId: null
};

function createWorkoutExercise(
  id: string,
  exerciseId: string,
  order: number,
  supersetId: string | null = null
): WorkoutExercise {
  return {
    id,
    workoutId: workout.id,
    exerciseId,
    order,
    supersetId,
    notes: null,
    sourceWorkoutExerciseId: null
  };
}

function createExercise(
  id: string,
  name: string,
  trackingType: string
): Exercise {
  return {
    id,
    name,
    normalizedName: name.toLowerCase(),
    equipment: null,
    trackingType,
    primaryMuscles: null,
    secondaryMuscles: null,
    isCustom: 0,
    isArchived: 0,
    createdAt: startedAt
  };
}

function createSet(
  id: string,
  workoutExerciseId: string,
  order: number,
  values: Pick<Set, 'weightKg' | 'reps'>
): Set {
  return {
    id,
    workoutExerciseId,
    order,
    weightKg: values.weightKg,
    reps: values.reps,
    distanceMeters: null,
    durationMs: null,
    durationSeconds: null,
    rpe: null,
    status: 'completed',
    completedAt: startedAt,
    sourceSetId: null
  };
}

test('maps workout log records to render-only values', () => {
  assert.deepEqual(mapWorkoutLogItems([{ workout, setCount: 1 }]), [
    {
      id: 'workout-1',
      name: 'Push day',
      durationLabel: '45 min',
      dateLabel: new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(startedAt)),
      setCountLabel: '1 set'
    }
  ]);
});

test('maps template records without exposing repository-shaped items', () => {
  const template = {
    id: 'template-1',
    name: 'Upper body',
    sourceWorkoutId: null,
    createdAt: startedAt,
    updatedAt: startedAt
  };

  assert.deepEqual(
    mapWorkoutLogTemplates([
      {
        template,
        exerciseRows: [],
        exerciseCount: 2,
        exerciseSummary: 'Bench press, Row'
      }
    ]),
    [
      {
        id: 'template-1',
        name: 'Upper body',
        exerciseCountLabel: '2 exercises',
        exerciseSummary: 'Bench press, Row'
      }
    ]
  );
});

test('maps detail sets, tracking formats, supersets, and action labels', () => {
  const benchRow = createWorkoutExercise(
    'workout-exercise-1',
    'bench',
    0,
    'superset-1'
  );
  const crunchRow = createWorkoutExercise(
    'workout-exercise-2',
    'crunch',
    1,
    'superset-1'
  );
  const benchSets = [
    createSet('set-1', benchRow.id, 0, { weightKg: 60, reps: 8 }),
    createSet('set-2', benchRow.id, 1, { weightKg: 60, reps: 8 }),
    createSet('set-3', benchRow.id, 2, { weightKg: 65, reps: 6 })
  ];
  const crunchSets = [
    createSet('set-4', crunchRow.id, 0, { weightKg: null, reps: 20 })
  ];

  const model = mapWorkoutHistoryDetailUiModel(
    {
      workout,
      workoutExerciseRows: [benchRow, crunchRow],
      exerciseById: new Map([
        ['bench', createExercise('bench', 'Bench press', 'weight_reps')],
        ['crunch', createExercise('crunch', 'Crunch', 'reps')]
      ]),
      setsByWorkoutExerciseId: new Map([
        [benchRow.id, benchSets],
        [crunchRow.id, crunchSets]
      ]),
      totalVolume: 1_350,
      totalCompletedSets: 4
    },
    'kg',
    { hasActiveWorkout: true, hasSavedTemplate: false }
  );

  assert.equal(model.durationLabel, '45 min');
  assert.equal(model.setCountLabel, '4');
  assert.equal(model.volumeLabel, '1,350 kg');
  assert.equal(model.exerciseCountLabel, '2 total');
  assert.equal(model.repeatButtonLabel, 'Resume active workout');
  assert.equal(model.canSaveAsTemplate, true);
  assert.deepEqual(model.exerciseBlocks, [
    {
      id: 'superset-1',
      supersetLabel: 'Superset A',
      exercises: [
        {
          id: benchRow.id,
          exerciseName: 'Bench press',
          setCountLabel: '3 sets',
          latestSetLabel: '65 kg x 6',
          volumeLabel: '1,350 kg total',
          setRows: [
            {
              id: 'set-1-set-2',
              positionLabel: '1-2',
              valueLabel: '60 kg x 8'
            },
            {
              id: 'set-3',
              positionLabel: '3',
              valueLabel: '65 kg x 6'
            }
          ]
        },
        {
          id: crunchRow.id,
          exerciseName: 'Crunch',
          setCountLabel: '1 set',
          latestSetLabel: '20 reps',
          volumeLabel: undefined,
          setRows: []
        }
      ]
    }
  ]);
});

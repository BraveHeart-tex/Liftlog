import type { Set } from '@/src/db';
import { mapWorkoutExerciseSummary } from '@/src/features/workouts/shared/workout-exercise-summary.ui-model';
import assert from 'node:assert/strict';
import test from 'node:test';

function createSet(id: string, weightKg: number, reps: number): Set {
  return {
    id,
    weightKg,
    reps,
    status: 'completed'
  } as Set;
}

test('maps raw sets to shared labels and personal-record rows', () => {
  const summary = mapWorkoutExerciseSummary({
    exerciseName: 'Bench press',
    completedSets: [
      createSet('set-1', 60, 8),
      createSet('set-2', 60, 8),
      createSet('set-3', 65, 6)
    ],
    weightUnit: 'kg',
    trackingType: 'weight_reps',
    personalRecordSetIds: new Set(['set-3'])
  });

  assert.deepEqual(summary, {
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
        valueLabel: '65 kg x 6',
        isPersonalRecord: true
      }
    ]
  });
});

test('keeps empty summaries label-free for the caller fallback', () => {
  assert.deepEqual(
    mapWorkoutExerciseSummary({
      exerciseName: 'Bench press',
      completedSets: [],
      weightUnit: 'kg',
      trackingType: 'weight_reps'
    }),
    {
      exerciseName: 'Bench press',
      setCountLabel: undefined,
      latestSetLabel: undefined,
      volumeLabel: undefined,
      setRows: []
    }
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { matchesExercisePickerFilters } from '@/src/features/workouts/exercise-selection/exercise-picker-filter.utils';

function createExercise(
  id: string,
  equipment: ExerciseListItem['equipment'],
  isCustom = 0
): ExerciseListItem {
  return { id, equipment, isCustom } as ExerciseListItem;
}

test('combines primary and equipment filters', () => {
  const barbell = createExercise('barbell', 'barbell');
  const customDumbbell = createExercise('custom-dumbbell', 'dumbbell', 1);
  const recentIds = new Set(['barbell']);

  assert.equal(
    matchesExercisePickerFilters(barbell, 'recent', 'barbell', recentIds),
    true
  );
  assert.equal(
    matchesExercisePickerFilters(barbell, 'recent', 'dumbbell', recentIds),
    false
  );
  assert.equal(
    matchesExercisePickerFilters(
      customDumbbell,
      'custom',
      'dumbbell',
      recentIds
    ),
    true
  );
});

test('null equipment leaves the primary filter unchanged', () => {
  const exercise = createExercise('barbell', 'barbell');

  assert.equal(
    matchesExercisePickerFilters(exercise, 'all', null, new Set()),
    true
  );
  assert.equal(
    matchesExercisePickerFilters(exercise, 'recent', null, new Set()),
    false
  );
});

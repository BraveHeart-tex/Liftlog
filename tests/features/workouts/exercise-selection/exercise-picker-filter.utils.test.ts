import assert from 'node:assert/strict';
import { matchesExercisePickerFilters } from '@/src/features/workouts/exercise-selection/exercise-picker-filter.utils';
import { exerciseListItem } from '@/tests/support/factories';

test('combines primary and equipment filters', () => {
  const barbell = exerciseListItem({ id: 'barbell', equipment: 'barbell' });
  const customDumbbell = exerciseListItem({
    id: 'custom-dumbbell',
    equipment: 'dumbbell',
    isCustom: 1
  });
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
  const exercise = exerciseListItem({ id: 'barbell', equipment: 'barbell' });

  assert.equal(
    matchesExercisePickerFilters(exercise, 'all', null, new Set()),
    true
  );
  assert.equal(
    matchesExercisePickerFilters(exercise, 'recent', null, new Set()),
    false
  );
});

test('normalizes equipment values before matching', () => {
  const exercise = exerciseListItem({ id: 'barbell', equipment: ' BarBell ' });

  assert.equal(
    matchesExercisePickerFilters(exercise, 'all', 'barbell', new Set()),
    true
  );
});

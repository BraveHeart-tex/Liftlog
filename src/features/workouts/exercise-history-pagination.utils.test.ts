import {
  canLoadExerciseHistoryPage,
  didExerciseHistoryPageFinish,
  getNextExerciseHistoryLimit
} from '@/src/features/workouts/exercise-history-pagination.utils';
import assert from 'node:assert/strict';
import test from 'node:test';

test('prevents duplicate history page requests', () => {
  assert.equal(
    canLoadExerciseHistoryPage({
      hasMoreHistory: true,
      isLoadingMore: true,
      hasActiveRequest: true,
      hasLoadMoreError: false
    }),
    false
  );
});

test('blocks pagination after an error until retry', () => {
  assert.equal(
    canLoadExerciseHistoryPage({
      hasMoreHistory: true,
      isLoadingMore: false,
      hasActiveRequest: false,
      hasLoadMoreError: true
    }),
    false
  );
});

test('increments the visible limit by one page', () => {
  assert.equal(getNextExerciseHistoryLimit(20, 20), 40);
});

test('finishes only after workout and set reads both update', () => {
  const previousWorkoutRead = new Date(1);
  const previousSetRead = new Date(2);

  assert.equal(
    didExerciseHistoryPageFinish(
      previousWorkoutRead,
      previousSetRead,
      new Date(3),
      previousSetRead
    ),
    false
  );
  assert.equal(
    didExerciseHistoryPageFinish(
      previousWorkoutRead,
      previousSetRead,
      new Date(3),
      new Date(4)
    ),
    true
  );
});

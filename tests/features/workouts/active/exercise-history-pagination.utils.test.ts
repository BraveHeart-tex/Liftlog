import {
  canLoadExerciseHistoryPage,
  didExerciseHistoryPageFinish,
  getNextExerciseHistoryLimit
} from '@/src/features/workouts/active/exercise-history-pagination.utils';
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

test('finishes after the shared history read updates', () => {
  const previousRead = new Date(1);

  assert.equal(
    didExerciseHistoryPageFinish({
      previousUpdatedAt: previousRead,
      updatedAt: previousRead
    }),
    false
  );
  assert.equal(
    didExerciseHistoryPageFinish({
      previousUpdatedAt: previousRead,
      updatedAt: new Date(2)
    }),
    true
  );
});

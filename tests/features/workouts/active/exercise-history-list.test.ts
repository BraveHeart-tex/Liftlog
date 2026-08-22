import type { Set } from '@/src/db';
import {
  formatExerciseHistorySessionMetadata,
  formatRollingProgression
} from '@/src/features/workouts/active/exercise-history-format.utils';
import assert from 'node:assert/strict';
import test from 'node:test';

test('describes the rolling comparison accurately', () => {
  assert.equal(
    formatRollingProgression('weight_reps', 54.3, 'kg'),
    '+54.3 kg vs prior 30 days'
  );
});

test('preserves long formatted progression values', () => {
  assert.equal(
    formatRollingProgression('weight_reps', 123456.7, 'kg'),
    '+123456.7 kg vs prior 30 days'
  );
});

test('shows established volume only for weight and reps history', () => {
  const sets = [
    { weightKg: 60, reps: 10 },
    { weightKg: 70, reps: 5 }
  ] as Set[];

  assert.equal(
    formatExerciseHistorySessionMetadata(sets, 'weight_reps', 'kg'),
    '2 sets · 950 kg total'
  );
  assert.equal(
    formatExerciseHistorySessionMetadata(sets, 'reps', 'kg'),
    '2 sets'
  );
});

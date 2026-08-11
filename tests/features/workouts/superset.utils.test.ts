import {
  formatSupersetExerciseLabel,
  getSupersetLetter
} from '@/src/features/workouts/superset.utils';
import assert from 'node:assert/strict';
import test from 'node:test';

test('derives the superset letter from its display label', () => {
  assert.equal(getSupersetLetter('Superset A'), 'A');
  assert.equal(getSupersetLetter('Superset AA'), 'AA');
});

test('formats positional superset exercise labels', () => {
  assert.equal(formatSupersetExerciseLabel('A', 1), 'A1');
  assert.equal(formatSupersetExerciseLabel('B', 2), 'B2');
});

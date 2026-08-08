import type { Set } from '@/src/db';
import {
  formatDisplaySetPosition,
  getDisplaySetGroups
} from '@/src/features/workouts/set-display.utils';
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

test('uses positional ranges for repeated sets and indexes for mixed sets', () => {
  const groups = getDisplaySetGroups([
    createSet('1', 60, 8),
    createSet('2', 70, 6),
    createSet('3', 70, 6),
    createSet('4', 70, 6),
    createSet('5', 75, 5)
  ]);

  assert.deepEqual(groups.map(formatDisplaySetPosition), ['1', '2-4', '5']);
});

test('does not group identical sets across a PR boundary', () => {
  const groups = getDisplaySetGroups(
    [createSet('1', 80, 5), createSet('2', 80, 5), createSet('3', 80, 5)],
    { personalRecordSetIds: new Set(['2']) }
  );

  assert.deepEqual(
    groups.map(group => ({
      position: formatDisplaySetPosition(group),
      setIds: group.setIds
    })),
    [
      { position: '1', setIds: ['1'] },
      { position: '2', setIds: ['2'] },
      { position: '3', setIds: ['3'] }
    ]
  );
});

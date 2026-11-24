import {
  formatDisplaySetPosition,
  getDisplaySetGroups
} from '@/src/features/workouts/shared/set-display.utils';
import assert from 'node:assert/strict';
import { setRow } from '@/tests/support/factories';

test('uses positional ranges for repeated sets and indexes for mixed sets', () => {
  const groups = getDisplaySetGroups([
    setRow({ id: '1', weightKg: 60, reps: 8 }),
    setRow({ id: '2', weightKg: 70, reps: 6 }),
    setRow({ id: '3', weightKg: 70, reps: 6 }),
    setRow({ id: '4', weightKg: 70, reps: 6 }),
    setRow({ id: '5', weightKg: 75, reps: 5 })
  ]);

  assert.deepEqual(groups.map(formatDisplaySetPosition), ['1', '2-4', '5']);
});

test('does not group identical sets across a PR boundary', () => {
  const groups = getDisplaySetGroups(
    [
      setRow({ id: '1', weightKg: 80, reps: 5 }),
      setRow({ id: '2', weightKg: 80, reps: 5 }),
      setRow({ id: '3', weightKg: 80, reps: 5 })
    ],
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

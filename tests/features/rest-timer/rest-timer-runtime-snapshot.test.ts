import {
  createRestTimerSnapshotStore,
  type RestTimerRuntimeSnapshot
} from '@/src/features/rest-timer/rest-timer-runtime-snapshot';
import assert from 'node:assert/strict';
import test from 'node:test';

function memoryStorage(initialValue?: string) {
  let value = initialValue;
  let removals = 0;

  return {
    getString: () => value,
    set: (_key: string, nextValue: string) => {
      value = nextValue;
    },
    remove: () => {
      value = undefined;
      removals += 1;

      return true;
    },
    current: () => value,
    removals: () => removals
  };
}

test('runtime snapshot round trips complete running state', () => {
  const storage = memoryStorage();
  const snapshots = createRestTimerSnapshotStore(storage);
  const snapshot: RestTimerRuntimeSnapshot = {
    version: 1,
    status: 'running',
    deadlineEpochMs: 91_000,
    durationSeconds: 90,
    activeDurationSeconds: 120,
    context: {
      workoutId: 'workout-1',
      workoutExerciseId: 'exercise-1',
      exerciseName: 'Bench press'
    }
  };

  snapshots.write(snapshot);

  assert.deepEqual(snapshots.read(), {
    kind: 'snapshot',
    snapshot
  });
});

test('runtime snapshot rejects and clears malformed state as a whole', () => {
  const storage = memoryStorage(
    JSON.stringify({
      version: 1,
      status: 'paused',
      remainingMs: 45_000,
      durationSeconds: 90,
      activeDurationSeconds: '120',
      pausedAtEpochMs: 1_000
    })
  );
  const snapshots = createRestTimerSnapshotStore(storage);

  assert.deepEqual(snapshots.read(), { kind: 'invalid' });
  assert.equal(storage.current(), undefined);
  assert.equal(storage.removals(), 1);
});

test('runtime snapshot rejects unsupported versions', () => {
  const storage = memoryStorage(
    JSON.stringify({
      version: 2,
      status: 'running',
      deadlineEpochMs: 91_000,
      durationSeconds: 90,
      activeDurationSeconds: 90
    })
  );
  const snapshots = createRestTimerSnapshotStore(storage);

  assert.deepEqual(snapshots.read(), { kind: 'invalid' });
  assert.equal(storage.current(), undefined);
});

import { createLatestRestTimerNotificationAccessReconciler } from '@/src/features/rest-timer/rest-timer-notification-access';
import type { RestTimerNotificationAccess } from '@/src/features/rest-timer/rest-timer.coordinator';
import assert from 'node:assert/strict';
import test from 'node:test';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(next => {
    resolve = next;
  });

  return { promise, resolve };
}

test('a late permission read cannot replace newer notification access', async () => {
  const older = deferred<RestTimerNotificationAccess>();
  const newer = deferred<RestTimerNotificationAccess>();
  const reads = [older.promise, newer.promise];
  const applied: RestTimerNotificationAccess[] = [];
  const reconcile = createLatestRestTimerNotificationAccessReconciler(
    async () => reads.shift()!,
    access => applied.push(access)
  );

  const olderReconciliation = reconcile();
  const newerReconciliation = reconcile();
  newer.resolve({ permission: 'granted', exactAlarm: 'unavailable' });
  await newerReconciliation;
  older.resolve({ permission: 'blocked', exactAlarm: 'available' });
  await olderReconciliation;

  assert.deepEqual(applied, [
    { permission: 'granted', exactAlarm: 'unavailable' }
  ]);
});

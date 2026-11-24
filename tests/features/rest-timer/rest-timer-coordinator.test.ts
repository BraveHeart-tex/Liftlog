import { createRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import {
  createRestTimerCoordinator,
  type RestTimerAppState,
  type RestTimerFeedbackPort,
  type RestTimerNotificationPort
} from '@/src/features/rest-timer/rest-timer.coordinator';
import type {
  RestTimerRuntimeSnapshot,
  RestTimerSnapshotReadResult
} from '@/src/features/rest-timer/rest-timer-runtime-snapshot';
import assert from 'node:assert/strict';

type CoordinatorDependencies = Parameters<typeof createRestTimerCoordinator>[0];

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(next => {
    resolve = next;
  });

  return { promise, resolve };
}

function appStateSource(initial: RestTimerAppState = 'active') {
  let state = initial;
  const listeners = new Set<(next: RestTimerAppState) => void>();

  return {
    current: () => state,
    subscribe(listener: (next: RestTimerAppState) => void) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    change(next: RestTimerAppState) {
      state = next;
      listeners.forEach(listener => listener(next));
    }
  };
}

const idleScheduler = {
  every: () => () => undefined
};

function manualScheduler() {
  let operation: (() => void) | undefined;

  return {
    every(nextOperation: () => void) {
      operation = nextOperation;

      return () => {
        operation = undefined;
      };
    },
    fire() {
      operation?.();
    }
  };
}

function snapshotStore(
  initial: RestTimerSnapshotReadResult = { kind: 'empty' }
) {
  let result = initial;
  const writes: RestTimerRuntimeSnapshot[] = [];
  let clears = 0;

  return {
    read: () => result,
    write(snapshot: RestTimerRuntimeSnapshot) {
      writes.push(snapshot);
      result = { kind: 'snapshot', snapshot };
    },
    clear() {
      clears += 1;
      result = { kind: 'empty' };
    },
    writes,
    clears: () => clears
  };
}

interface HarnessOptions {
  now?: number;
  appState?: RestTimerAppState;
  scheduler?: CoordinatorDependencies['scheduler'];
  snapshot?: RestTimerSnapshotReadResult;
  snapshots?: CoordinatorDependencies['snapshots'];
  workoutActive?: boolean;
  notificationsEnabled?: boolean;
  delivered?: boolean | ((deadlineEpochMs: number) => boolean);
  /** Adds a recording `cancelPending`; absent, the coordinator falls back to `cancel`. */
  recordPendingCancellations?: boolean;
  /** Adds a recording `acknowledge`; absent, the coordinator falls back to `stop`. */
  recordAcknowledgements?: boolean;
  notifications?: Partial<RestTimerNotificationPort>;
  feedback?: Partial<RestTimerFeedbackPort>;
}

function harness(options: HarnessOptions = {}) {
  let now = options.now ?? 1_000;
  const record = {
    deadlines: [] as number[],
    cancellations: 0,
    pendingCancellations: 0,
    deliveredLookups: [] as number[],
    completions: [] as { showMessage: boolean }[],
    feedbackCancels: 0,
    feedbackStops: 0,
    acknowledgements: 0,
    failureMessages: 0,
    errors: [] as string[]
  };
  const delivered = options.delivered ?? false;
  const timer = createRestTimerStore({ now: () => now });
  const appState = appStateSource(options.appState);
  const snapshots = snapshotStore(options.snapshot);
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState,
    scheduler: options.scheduler ?? idleScheduler,
    snapshots: options.snapshots ?? snapshots,
    context: { isWorkoutActive: () => options.workoutActive ?? true },
    notificationsEnabled: options.notificationsEnabled,
    notifications: {
      schedule: ({ deadlineEpochMs }) => {
        record.deadlines.push(deadlineEpochMs);
      },
      cancel: () => {
        record.cancellations += 1;
      },
      ...(options.recordPendingCancellations
        ? {
            cancelPending: () => {
              record.pendingCancellations += 1;
            }
          }
        : {}),
      hasDelivered: deadlineEpochMs => {
        record.deliveredLookups.push(deadlineEpochMs);

        return typeof delivered === 'function'
          ? delivered(deadlineEpochMs)
          : delivered;
      },
      ...options.notifications
    },
    feedback: {
      complete: completion => {
        record.completions.push(completion);
      },
      cancel: () => {
        record.feedbackCancels += 1;
      },
      stop: () => {
        record.feedbackStops += 1;
      },
      ...(options.recordAcknowledgements
        ? {
            acknowledge: () => {
              record.acknowledgements += 1;
            }
          }
        : {}),
      notificationFailure: () => {
        record.failureMessages += 1;
      },
      ...options.feedback
    },
    onError: (_error, operation) => {
      record.errors.push(operation);
    }
  });

  return {
    timer,
    coordinator,
    appState,
    snapshots,
    record,
    setNow(next: number) {
      now = next;
    }
  };
}

test('starting a timer publishes a timestamped monotonic transition', () => {
  const timer = createRestTimerStore({ now: () => 1_000 });

  assert.equal(timer.getState().start(90, { workoutId: 'workout-1' }), true);
  assert.deepEqual(timer.getState().transition, {
    sequence: 1,
    kind: 'start',
    occurredAtEpochMs: 1_000
  });
});

test('timer lifecycle changes publish explicit transitions in order', () => {
  let now = 1_000;
  const timer = createRestTimerStore({ now: () => now });

  timer.getState().start(90);
  now = 2_000;
  timer.getState().addTime(30);
  assert.deepEqual(timer.getState().transition, {
    sequence: 2,
    kind: 'reschedule',
    occurredAtEpochMs: 2_000
  });

  now = 3_000;
  timer.getState().pause();
  assert.deepEqual(timer.getState().transition, {
    sequence: 3,
    kind: 'pause',
    occurredAtEpochMs: 3_000
  });

  now = 4_000;
  timer.getState().resume();
  assert.deepEqual(timer.getState().transition, {
    sequence: 4,
    kind: 'resume',
    occurredAtEpochMs: 4_000
  });

  now = 5_000;
  assert.equal(timer.getState().cancel(), true);
  assert.deepEqual(timer.getState().transition, {
    sequence: 5,
    kind: 'cancel',
    occurredAtEpochMs: 5_000
  });

  timer.getState().start(10);
  now = 15_000;
  timer.getState().tick();
  assert.deepEqual(timer.getState().transition, {
    sequence: 7,
    kind: 'complete',
    occurredAtEpochMs: 15_000
  });
});

test('hydrating a timer publishes an explicit transition', () => {
  const timer = createRestTimerStore({ now: () => 4_000 });

  timer.getState().hydrate({
    status: 'paused',
    remainingMs: 45_000,
    durationSeconds: 90,
    activeDurationSeconds: 120,
    context: { workoutId: 'workout-1' }
  });

  assert.equal(timer.getState().status, 'paused');
  assert.equal(timer.getState().secondsRemaining, 45);
  assert.deepEqual(timer.getState().transition, {
    sequence: 1,
    kind: 'hydrate',
    occurredAtEpochMs: 4_000
  });
});

test('coordinator serializes notification work and leaves the latest transition in control', async () => {
  let concurrentOperations = 0;
  let maximumConcurrentOperations = 0;
  let notificationState = 'none';
  const pendingSchedule = deferred();
  const { timer, coordinator, setNow } = harness({
    notifications: {
      async schedule() {
        concurrentOperations += 1;
        maximumConcurrentOperations = Math.max(
          maximumConcurrentOperations,
          concurrentOperations
        );
        await pendingSchedule.promise;
        notificationState = 'scheduled';
        concurrentOperations -= 1;
      },
      async cancel() {
        concurrentOperations += 1;
        maximumConcurrentOperations = Math.max(
          maximumConcurrentOperations,
          concurrentOperations
        );
        notificationState = 'cancelled';
        concurrentOperations -= 1;
      }
    }
  });

  coordinator.start();
  timer.getState().start(90);
  await new Promise(resolve => setImmediate(resolve));
  setNow(2_000);
  timer.getState().pause();
  pendingSchedule.resolve();
  await coordinator.settled();

  assert.equal(maximumConcurrentOperations, 1);
  assert.equal(notificationState, 'cancelled');
  coordinator.stop();
});

test('coordinator preserves foreground completion and cancellation feedback', async () => {
  const { timer, coordinator, record, setNow } = harness();

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  setNow(11_000);
  timer.getState().tick();
  await coordinator.settled();

  assert.deepEqual(record.completions, [{ showMessage: true }]);
  assert.equal(record.cancellations, 0);

  setNow(12_000);
  timer.getState().start(10);
  await coordinator.settled();
  assert.equal(timer.getState().cancel(), true);
  await coordinator.settled();

  assert.equal(record.cancellations, 1);
  assert.equal(record.feedbackCancels, 1);
  coordinator.stop();
});

test('coordinator gives background completion to native delivery', async () => {
  const { timer, coordinator, appState, record, setNow } = harness();

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  appState.change('background');
  setNow(11_000);
  timer.getState().tick();
  await coordinator.settled();

  assert.equal(record.feedbackStops, 1);
  assert.equal(record.completions.length, 0);
  coordinator.stop();
});

test('foreground reconciliation clears an old expiry without feedback', async () => {
  const { timer, coordinator, appState, record, setNow } = harness({
    appState: 'background'
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  setNow(20_000);
  appState.change('active');
  await coordinator.settled();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(record.deliveredLookups.length, 0);
  assert.equal(record.completions.length, 0);
  coordinator.stop();
});

test('foreground reconciliation gives recent expiry to delivered notification', async () => {
  const { timer, coordinator, appState, record, setNow } = harness({
    appState: 'background',
    delivered: true
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  setNow(11_000);
  appState.change('active');
  await coordinator.settled();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(record.completions.length, 0);
  coordinator.stop();
});

test('foreground reconciliation gives recent unowned expiry feedback once', async () => {
  const { timer, coordinator, appState, record, setNow } = harness({
    appState: 'background'
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  setNow(11_000);
  appState.change('active');
  await coordinator.settled();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(record.completions.length, 1);
  coordinator.stop();
});

test('foreground reconciliation owns a recent expiry completed by a background tick', async () => {
  const scheduler = manualScheduler();
  const { timer, coordinator, appState, record, setNow } = harness({
    appState: 'background',
    scheduler
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  setNow(11_000);
  scheduler.fire();
  assert.equal(timer.getState().status, 'idle');

  appState.change('active');
  await coordinator.settled();
  appState.change('background');
  appState.change('active');
  await coordinator.settled();

  assert.equal(record.completions.length, 1);
  coordinator.stop();
});

test('coordinator observes hydration that happened before it mounted', async () => {
  const { timer, coordinator, record } = harness();

  timer.getState().hydrate({
    status: 'running',
    endTime: 91_000,
    durationSeconds: 90,
    activeDurationSeconds: 90
  });

  coordinator.start();
  await coordinator.settled();

  assert.deepEqual(record.deadlines, [91_000]);
  coordinator.stop();
});

test('notification acknowledgement reconciles expiry without cancellation feedback', async () => {
  const { timer, coordinator, record, setNow } = harness({
    recordAcknowledgements: true
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  setNow(11_000);
  coordinator.acknowledgeNotificationCompletion();
  await coordinator.settled();

  assert.equal(timer.getState().transition?.kind, 'complete');
  assert.equal(record.completions.length, 0);
  assert.equal(record.feedbackCancels, 0);
  assert.equal(record.acknowledgements, 1);
  coordinator.stop();
});

test('reschedule, pause, and resume replace native delivery at current deadlines', async () => {
  const { timer, coordinator, record, setNow } = harness();

  coordinator.start();
  timer.getState().start(90);
  await coordinator.settled();
  setNow(2_000);
  timer.getState().addTime(30);
  await coordinator.settled();
  setNow(3_000);
  timer.getState().pause();
  await coordinator.settled();
  setNow(4_000);
  timer.getState().resume();
  await coordinator.settled();

  assert.deepEqual(record.deadlines, [91_000, 121_000, 122_000]);
  assert.equal(record.cancellations, 1);
  coordinator.stop();
});

test('open sheet completion keeps sound and haptics but suppresses its message', async () => {
  const { timer, coordinator, record, setNow } = harness();

  coordinator.start();
  timer.getState().setSheetOpen(true);
  timer.getState().start(10);
  await coordinator.settled();
  setNow(11_000);
  timer.getState().tick();
  await coordinator.settled();

  assert.deepEqual(record.completions, [{ showMessage: false }]);
  coordinator.stop();
});

test('mount does not replay a retained terminal transition', async () => {
  const { timer, coordinator, record, setNow } = harness();

  timer.getState().start(10);
  setNow(11_000);
  timer.getState().tick();

  coordinator.start();
  await coordinator.settled();

  assert.equal(record.completions.length, 0);
  coordinator.stop();
});

test('async cancellation cannot clear feedback after coordinator restart', async () => {
  const pendingCancellation = deferred();
  const { timer, coordinator, record } = harness({
    notifications: { cancel: () => pendingCancellation.promise }
  });

  coordinator.start();
  timer.getState().start(90);
  await coordinator.settled();
  timer.getState().cancel();
  await new Promise(resolve => setImmediate(resolve));
  coordinator.stop();
  coordinator.start();
  pendingCancellation.resolve();
  await coordinator.settled();

  assert.equal(record.feedbackCancels, 0);
  coordinator.stop();
});

test('restart refreshes app state before deciding completion ownership', async () => {
  const { timer, coordinator, appState, record, setNow } = harness();

  coordinator.start();
  coordinator.stop();
  appState.change('background');
  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  setNow(11_000);
  timer.getState().tick();
  await coordinator.settled();

  assert.equal(record.completions.length, 0);
  coordinator.stop();
});

test('startup restores a running timer from its absolute deadline before scheduling', async () => {
  const { timer, coordinator, record } = harness({
    now: 31_000,
    snapshot: {
      kind: 'snapshot',
      snapshot: {
        version: 1,
        status: 'running',
        deadlineEpochMs: 91_000,
        durationSeconds: 90,
        activeDurationSeconds: 90,
        context: { workoutId: 'workout-1' }
      }
    }
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.equal(timer.getState().status, 'running');
  assert.equal(timer.getState().secondsRemaining, 60);
  assert.deepEqual(record.deadlines, [91_000]);
  coordinator.stop();
});

test('startup restores a fresh paused timer and removes pending delivery', async () => {
  const { timer, coordinator, record } = harness({
    now: 2_000,
    snapshot: {
      kind: 'snapshot',
      snapshot: {
        version: 1,
        status: 'paused',
        remainingMs: 45_000,
        durationSeconds: 90,
        activeDurationSeconds: 120,
        pausedAtEpochMs: 1_000
      }
    }
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.equal(timer.getState().status, 'paused');
  assert.equal(timer.getState().secondsRemaining, 45);
  assert.equal(record.cancellations, 1);
  coordinator.stop();
});

test('startup silently clears paused timers older than 24 hours', async () => {
  const pausedAtEpochMs = 1_000;
  const { timer, coordinator, snapshots, record } = harness({
    now: pausedAtEpochMs + 24 * 60 * 60 * 1000 + 1,
    snapshot: {
      kind: 'snapshot',
      snapshot: {
        version: 1,
        status: 'paused',
        remainingMs: 45_000,
        durationSeconds: 90,
        activeDurationSeconds: 90,
        pausedAtEpochMs
      }
    }
  });

  await coordinator.restore();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(snapshots.clears(), 1);
  assert.equal(record.cancellations, 1);
});

const recentExpirySnapshot: RestTimerSnapshotReadResult = {
  kind: 'snapshot',
  snapshot: {
    version: 1,
    status: 'running',
    deadlineEpochMs: 10_000,
    durationSeconds: 10,
    activeDurationSeconds: 10
  }
};

test('startup gives a recent unowned expiry foreground feedback only once', async () => {
  const { timer, coordinator, snapshots, record } = harness({
    now: 14_999,
    snapshot: recentExpirySnapshot
  });

  await coordinator.restore();
  coordinator.start();
  coordinator.start();
  await coordinator.settled();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(snapshots.clears(), 1);
  assert.equal(record.cancellations, 1);
  assert.equal(record.completions.length, 1);
  coordinator.stop();
});

test('recent startup expiry waits for the app to become active', async () => {
  const { coordinator, appState, record } = harness({
    now: 14_999,
    appState: 'background',
    snapshot: recentExpirySnapshot
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();
  assert.equal(record.completions.length, 0);

  appState.change('active');
  await coordinator.settled();
  assert.equal(record.completions.length, 1);
  coordinator.stop();
});

test('recent startup expiry rechecks notification ownership on activation', async () => {
  let deliveredLookups = 0;
  let delivered = false;
  let pendingCancellations = 0;
  let dismissingCancellations = 0;
  const { coordinator, appState, record } = harness({
    now: 14_999,
    appState: 'background',
    snapshot: recentExpirySnapshot,
    notifications: {
      cancel: () => {
        dismissingCancellations += 1;
        delivered = false;
      },
      cancelPending: () => {
        pendingCancellations += 1;
        delivered = true;
      },
      hasDelivered: () => {
        deliveredLookups += 1;

        return delivered;
      }
    }
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();
  assert.equal(record.completions.length, 0);

  appState.change('active');
  await coordinator.settled();

  assert.equal(deliveredLookups, 2);
  assert.equal(pendingCancellations, 1);
  assert.equal(dismissingCancellations, 0);
  assert.equal(record.completions.length, 0);
  coordinator.stop();
});

test('startup checks delivered ownership for the restored deadline', async () => {
  const { coordinator, record } = harness({
    now: 14_999,
    snapshot: recentExpirySnapshot,
    delivered: deadlineEpochMs => deadlineEpochMs === 10_000
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.deepEqual(record.deliveredLookups, [10_000]);
  assert.equal(record.completions.length, 0);
  coordinator.stop();
});

test('coordinator restart does not lose queued startup completion feedback', async () => {
  const { coordinator, record } = harness({
    now: 14_999,
    snapshot: recentExpirySnapshot
  });

  await coordinator.restore();
  coordinator.start();
  coordinator.stop();
  coordinator.start();
  await coordinator.settled();

  assert.equal(record.completions.length, 1);
  coordinator.stop();
});

test('startup does not replay recent expiry when a delivered notification owns it', async () => {
  const { coordinator, snapshots, record } = harness({
    now: 15_000,
    snapshot: recentExpirySnapshot,
    delivered: true
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.equal(record.completions.length, 0);
  assert.equal(snapshots.clears(), 1);
  assert.equal(record.cancellations, 1);
  coordinator.stop();
});

test('startup clears invalid workout context with pending delivery', async () => {
  const { timer, coordinator, snapshots, record } = harness({
    now: 2_000,
    workoutActive: false,
    snapshot: {
      kind: 'snapshot',
      snapshot: {
        version: 1,
        status: 'running',
        deadlineEpochMs: 91_000,
        durationSeconds: 90,
        activeDurationSeconds: 90,
        context: { workoutId: 'completed-workout' }
      }
    }
  });

  await coordinator.restore();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(snapshots.clears(), 1);
  assert.equal(record.cancellations, 1);
});

test('startup removes pending delivery for a corrupt snapshot', async () => {
  const { timer, coordinator, record } = harness({
    now: 2_000,
    snapshot: { kind: 'invalid' }
  });

  await coordinator.restore();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(record.cancellations, 1);
});

test('snapshot write failure does not interrupt an in-session timer', async () => {
  const { timer, coordinator, record } = harness({
    snapshots: {
      read: () => ({ kind: 'empty' }),
      write: () => {
        throw new Error('disk unavailable');
      },
      clear: () => undefined
    }
  });

  coordinator.start();
  assert.equal(timer.getState().start(90), true);
  await coordinator.settled();

  assert.equal(timer.getState().status, 'running');
  assert.deepEqual(record.deadlines, [91_000]);
  assert.deepEqual(record.errors, ['persist']);
  coordinator.stop();
});

test('coordinator persists each new pause time for the 24-hour age', async () => {
  const { timer, coordinator, snapshots, setNow } = harness();

  coordinator.start();
  timer.getState().start(90);
  setNow(2_000);
  timer.getState().pause();
  setNow(3_000);
  timer.getState().resume();
  setNow(4_000);
  timer.getState().pause();
  await coordinator.settled();

  const lastSnapshot = snapshots.writes.at(-1);

  assert.equal(lastSnapshot?.status, 'paused');
  assert.equal(
    lastSnapshot?.status === 'paused'
      ? lastSnapshot.pausedAtEpochMs
      : undefined,
    4_000
  );
  coordinator.stop();
});

test('startup clears an old running expiry without delivered lookup or feedback', async () => {
  const { coordinator, snapshots, record } = harness({
    now: 15_001,
    snapshot: recentExpirySnapshot
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.equal(snapshots.clears(), 1);
  assert.equal(record.deliveredLookups.length, 0);
  assert.equal(record.cancellations, 1);
  assert.equal(record.completions.length, 0);
  coordinator.stop();
});

test('notification preference schedules and cancels against the current deadline', async () => {
  const { timer, coordinator, record } = harness({
    notificationsEnabled: false
  });

  coordinator.start();
  timer.getState().start(90);
  await coordinator.settled();
  assert.deepEqual(record.deadlines, []);

  coordinator.setNotificationsEnabled(true);
  await coordinator.settled();
  assert.deepEqual(record.deadlines, [91_000]);

  coordinator.reconcileNotifications();
  await coordinator.settled();
  assert.deepEqual(record.deadlines, [91_000, 91_000]);

  coordinator.setNotificationsEnabled(false);
  await coordinator.settled();
  assert.equal(timer.getState().status, 'running');
  assert.equal(record.cancellations >= 2, true);
  coordinator.stop();
});

test('authorization revocation cancels pending delivery without disabling intent', async () => {
  const { timer, coordinator, record } = harness({
    recordPendingCancellations: true
  });

  coordinator.start();
  timer.getState().start(90);
  await coordinator.settled();

  coordinator.reconcileNotificationAccess({
    permission: 'blocked',
    exactAlarm: 'available'
  });
  await coordinator.settled();
  timer.getState().addTime(30);
  await coordinator.settled();
  coordinator.reconcileNotificationAccess({
    permission: 'granted',
    exactAlarm: 'unavailable'
  });
  await coordinator.settled();

  assert.equal(timer.getState().status, 'running');
  assert.equal(record.pendingCancellations, 1);
  assert.deepEqual(record.deadlines, [91_000, 121_000]);
  coordinator.stop();
});

test('exact-alarm revocation replaces delivery at the unchanged deadline', async () => {
  const { timer, coordinator, record } = harness();

  coordinator.start();
  timer.getState().start(90);
  await coordinator.settled();
  coordinator.reconcileNotificationAccess({
    permission: 'granted',
    exactAlarm: 'available'
  });
  coordinator.reconcileNotificationAccess({
    permission: 'granted',
    exactAlarm: 'unavailable'
  });
  await coordinator.settled();

  assert.equal(timer.getState().endTime, 91_000);
  assert.deepEqual(record.deadlines, [91_000, 91_000]);
  coordinator.stop();
});

test('superseded reconciliation failure cannot surface stale feedback', async () => {
  let rejectSchedule!: (error: Error) => void;
  const pendingSchedule = new Promise<void>((_resolve, reject) => {
    rejectSchedule = reject;
  });
  let schedules = 0;
  const { timer, coordinator, record } = harness({
    notifications: {
      schedule: () => {
        schedules += 1;

        return schedules === 1 ? undefined : pendingSchedule;
      }
    }
  });

  coordinator.start();
  timer.getState().start(90);
  await coordinator.settled();
  coordinator.reconcileNotifications();
  await new Promise(resolve => setImmediate(resolve));
  coordinator.reconcileNotificationAccess({
    permission: 'blocked',
    exactAlarm: 'available'
  });
  rejectSchedule(new Error('late native failure'));
  await coordinator.settled();

  assert.equal(record.failureMessages, 0);
  assert.equal(timer.getState().status, 'running');
  coordinator.stop();
});

test('schedule failure message is shown once per session and resets on success', async () => {
  let shouldFail = true;
  const { timer, coordinator, record } = harness({
    notifications: {
      schedule: () => {
        if (shouldFail) {
          throw new Error('native detail must stay private');
        }
      }
    }
  });

  coordinator.start();
  timer.getState().start(90);
  await coordinator.settled();
  coordinator.reconcileNotifications();
  await coordinator.settled();
  assert.equal(record.failureMessages, 1);

  shouldFail = false;
  coordinator.reconcileNotifications();
  await coordinator.settled();
  shouldFail = true;
  coordinator.reconcileNotifications();
  await coordinator.settled();
  assert.equal(record.failureMessages, 2);

  timer.getState().cancel();
  timer.getState().start(90);
  await coordinator.settled();
  assert.equal(record.failureMessages, 3);
  coordinator.stop();
});

import { createRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import {
  createRestTimerCoordinator,
  type RestTimerAppState
} from '@/src/features/rest-timer/rest-timer.coordinator';
import type {
  RestTimerRuntimeSnapshot,
  RestTimerSnapshotReadResult
} from '@/src/features/rest-timer/rest-timer-runtime-snapshot';
import assert from 'node:assert/strict';
import test from 'node:test';

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
  let now = 1_000;
  let concurrentOperations = 0;
  let maximumConcurrentOperations = 0;
  let notificationState = 'none';
  const pendingSchedule = deferred();
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState: appStateSource(),
    scheduler: idleScheduler,
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
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().start(90);
  await new Promise(resolve => setImmediate(resolve));
  now = 2_000;
  timer.getState().pause();
  pendingSchedule.resolve();
  await coordinator.settled();

  assert.equal(maximumConcurrentOperations, 1);
  assert.equal(notificationState, 'cancelled');
  coordinator.stop();
});

test('coordinator preserves foreground completion and cancellation feedback', async () => {
  let now = 1_000;
  let notificationCancels = 0;
  let feedbackCancels = 0;
  const completions: { showMessage: boolean }[] = [];
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState: appStateSource(),
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => {
        notificationCancels += 1;
      }
    },
    feedback: {
      complete: completion => {
        completions.push(completion);
      },
      cancel: () => {
        feedbackCancels += 1;
      },
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  now = 11_000;
  timer.getState().tick();
  await coordinator.settled();

  assert.deepEqual(completions, [{ showMessage: true }]);
  assert.equal(notificationCancels, 0);

  now = 12_000;
  timer.getState().start(10);
  await coordinator.settled();
  assert.equal(timer.getState().cancel(), true);
  await coordinator.settled();

  assert.equal(notificationCancels, 1);
  assert.equal(feedbackCancels, 1);
  coordinator.stop();
});

test('coordinator gives background completion to native delivery', async () => {
  let now = 1_000;
  let completions = 0;
  let feedbackStops = 0;
  const appState = appStateSource();
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState,
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => {
        feedbackStops += 1;
      }
    }
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  appState.change('background');
  now = 11_000;
  timer.getState().tick();
  await coordinator.settled();

  assert.equal(feedbackStops, 1);
  assert.equal(completions, 0);
  coordinator.stop();
});

test('foreground reconciliation clears an old expiry without feedback', async () => {
  let now = 1_000;
  let completions = 0;
  let deliveredLookups = 0;
  const appState = appStateSource('background');
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState,
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined,
      hasDelivered: () => {
        deliveredLookups += 1;

        return false;
      }
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  now = 20_000;
  appState.change('active');
  await coordinator.settled();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(deliveredLookups, 0);
  assert.equal(completions, 0);
  coordinator.stop();
});

test('foreground reconciliation gives recent expiry to delivered notification', async () => {
  let now = 1_000;
  let completions = 0;
  const appState = appStateSource('background');
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState,
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined,
      hasDelivered: () => true
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  now = 11_000;
  appState.change('active');
  await coordinator.settled();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(completions, 0);
  coordinator.stop();
});

test('foreground reconciliation gives recent unowned expiry feedback once', async () => {
  let now = 1_000;
  let completions = 0;
  const appState = appStateSource('background');
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState,
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined,
      hasDelivered: () => false
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  now = 11_000;
  appState.change('active');
  await coordinator.settled();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(completions, 1);
  coordinator.stop();
});

test('coordinator observes hydration that happened before it mounted', async () => {
  const schedules: number[] = [];
  const timer = createRestTimerStore({ now: () => 1_000 });

  timer.getState().hydrate({
    status: 'running',
    endTime: 91_000,
    durationSeconds: 90,
    activeDurationSeconds: 90
  });

  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 1_000 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    notifications: {
      schedule: ({ deadlineEpochMs }) => {
        schedules.push(deadlineEpochMs);
      },
      cancel: () => undefined
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  await coordinator.settled();

  assert.deepEqual(schedules, [91_000]);
  coordinator.stop();
});

test('notification acknowledgement reconciles expiry without cancellation feedback', async () => {
  let now = 1_000;
  let completions = 0;
  let cancellations = 0;
  let acknowledgements = 0;
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState: appStateSource(),
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => {
        cancellations += 1;
      },
      acknowledge: () => {
        acknowledgements += 1;
      },
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  now = 11_000;
  coordinator.acknowledgeNotificationCompletion();
  await coordinator.settled();

  assert.equal(timer.getState().transition?.kind, 'complete');
  assert.equal(completions, 0);
  assert.equal(cancellations, 0);
  assert.equal(acknowledgements, 1);
  coordinator.stop();
});

test('reschedule, pause, and resume replace native delivery at current deadlines', async () => {
  let now = 1_000;
  let cancellations = 0;
  const deadlines: number[] = [];
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState: appStateSource(),
    scheduler: idleScheduler,
    notifications: {
      schedule: ({ deadlineEpochMs }) => {
        deadlines.push(deadlineEpochMs);
      },
      cancel: () => {
        cancellations += 1;
      }
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().start(90);
  await coordinator.settled();
  now = 2_000;
  timer.getState().addTime(30);
  await coordinator.settled();
  now = 3_000;
  timer.getState().pause();
  await coordinator.settled();
  now = 4_000;
  timer.getState().resume();
  await coordinator.settled();

  assert.deepEqual(deadlines, [91_000, 121_000, 122_000]);
  assert.equal(cancellations, 1);
  coordinator.stop();
});

test('open sheet completion keeps sound and haptics but suppresses its message', async () => {
  let now = 1_000;
  const completions: { showMessage: boolean }[] = [];
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState: appStateSource(),
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined
    },
    feedback: {
      complete: completion => {
        completions.push(completion);
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().setSheetOpen(true);
  timer.getState().start(10);
  await coordinator.settled();
  now = 11_000;
  timer.getState().tick();
  await coordinator.settled();

  assert.deepEqual(completions, [{ showMessage: false }]);
  coordinator.stop();
});

test('mount does not replay a retained terminal transition', async () => {
  let now = 1_000;
  let completions = 0;
  const timer = createRestTimerStore({ now: () => now });

  timer.getState().start(10);
  now = 11_000;
  timer.getState().tick();

  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState: appStateSource(),
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  await coordinator.settled();

  assert.equal(completions, 0);
  coordinator.stop();
});

test('async cancellation cannot clear feedback after coordinator restart', async () => {
  const pendingCancellation = deferred();
  let feedbackCancellations = 0;
  const timer = createRestTimerStore({ now: () => 1_000 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 1_000 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => pendingCancellation.promise
    },
    feedback: {
      complete: () => undefined,
      cancel: () => {
        feedbackCancellations += 1;
      },
      stop: () => undefined
    }
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

  assert.equal(feedbackCancellations, 0);
  coordinator.stop();
});

test('restart refreshes app state before deciding completion ownership', async () => {
  let now = 1_000;
  let completions = 0;
  const appState = appStateSource();
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState,
    scheduler: idleScheduler,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  coordinator.stop();
  appState.change('background');
  coordinator.start();
  timer.getState().start(10);
  await coordinator.settled();
  now = 11_000;
  timer.getState().tick();
  await coordinator.settled();

  assert.equal(completions, 0);
  coordinator.stop();
});

test('startup restores a running timer from its absolute deadline before scheduling', async () => {
  const snapshots = snapshotStore({
    kind: 'snapshot',
    snapshot: {
      version: 1,
      status: 'running',
      deadlineEpochMs: 91_000,
      durationSeconds: 90,
      activeDurationSeconds: 90,
      transitionOccurredAtEpochMs: 1_000,
      context: { workoutId: 'workout-1' }
    }
  });
  const deadlines: number[] = [];
  const timer = createRestTimerStore({ now: () => 31_000 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 31_000 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots,
    context: { isWorkoutActive: () => true },
    notifications: {
      schedule: ({ deadlineEpochMs }) => {
        deadlines.push(deadlineEpochMs);
      },
      cancel: () => undefined,
      hasDelivered: () => false
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.equal(timer.getState().status, 'running');
  assert.equal(timer.getState().secondsRemaining, 60);
  assert.deepEqual(deadlines, [91_000]);
  coordinator.stop();
});

test('startup restores a fresh paused timer and removes pending delivery', async () => {
  let cancellations = 0;
  const snapshots = snapshotStore({
    kind: 'snapshot',
    snapshot: {
      version: 1,
      status: 'paused',
      remainingMs: 45_000,
      durationSeconds: 90,
      activeDurationSeconds: 120,
      pausedAtEpochMs: 1_000
    }
  });
  const timer = createRestTimerStore({ now: () => 2_000 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 2_000 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots,
    context: { isWorkoutActive: () => true },
    notifications: {
      schedule: () => undefined,
      cancel: () => {
        cancellations += 1;
      },
      hasDelivered: () => false
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.equal(timer.getState().status, 'paused');
  assert.equal(timer.getState().secondsRemaining, 45);
  assert.equal(cancellations, 1);
  coordinator.stop();
});

test('startup silently clears paused timers older than 24 hours', async () => {
  let cancellations = 0;
  const pausedAtEpochMs = 1_000;
  const snapshots = snapshotStore({
    kind: 'snapshot',
    snapshot: {
      version: 1,
      status: 'paused',
      remainingMs: 45_000,
      durationSeconds: 90,
      activeDurationSeconds: 90,
      pausedAtEpochMs
    }
  });
  const timer = createRestTimerStore({
    now: () => pausedAtEpochMs + 24 * 60 * 60 * 1000 + 1
  });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => pausedAtEpochMs + 24 * 60 * 60 * 1000 + 1 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots,
    context: { isWorkoutActive: () => true },
    notifications: {
      schedule: () => undefined,
      cancel: () => {
        cancellations += 1;
      },
      hasDelivered: () => false
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(snapshots.clears(), 1);
  assert.equal(cancellations, 1);
});

test('startup gives a recent unowned expiry foreground feedback only once', async () => {
  let completions = 0;
  const snapshots = snapshotStore({
    kind: 'snapshot',
    snapshot: {
      version: 1,
      status: 'running',
      deadlineEpochMs: 10_000,
      durationSeconds: 10,
      activeDurationSeconds: 10,
      transitionOccurredAtEpochMs: 0
    }
  });
  const timer = createRestTimerStore({ now: () => 14_999 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 14_999 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots,
    context: { isWorkoutActive: () => true },
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined,
      hasDelivered: () => false
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();
  coordinator.start();
  coordinator.start();
  await coordinator.settled();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(snapshots.clears(), 1);
  assert.equal(completions, 1);
  coordinator.stop();
});

test('recent startup expiry waits for the app to become active', async () => {
  let completions = 0;
  const appState = appStateSource('background');
  const timer = createRestTimerStore({ now: () => 14_999 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 14_999 },
    appState,
    scheduler: idleScheduler,
    snapshots: snapshotStore({
      kind: 'snapshot',
      snapshot: {
        version: 1,
        status: 'running',
        deadlineEpochMs: 10_000,
        durationSeconds: 10,
        activeDurationSeconds: 10,
        transitionOccurredAtEpochMs: 0
      }
    }),
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined,
      hasDelivered: () => false
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();
  assert.equal(completions, 0);

  appState.change('active');
  await coordinator.settled();
  assert.equal(completions, 1);
  coordinator.stop();
});

test('coordinator restart does not lose queued startup completion feedback', async () => {
  let completions = 0;
  const timer = createRestTimerStore({ now: () => 14_999 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 14_999 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots: snapshotStore({
      kind: 'snapshot',
      snapshot: {
        version: 1,
        status: 'running',
        deadlineEpochMs: 10_000,
        durationSeconds: 10,
        activeDurationSeconds: 10,
        transitionOccurredAtEpochMs: 0
      }
    }),
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined,
      hasDelivered: () => false
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();
  coordinator.start();
  coordinator.stop();
  coordinator.start();
  await coordinator.settled();

  assert.equal(completions, 1);
  coordinator.stop();
});

test('startup does not replay recent expiry when a delivered notification owns it', async () => {
  let completions = 0;
  const snapshots = snapshotStore({
    kind: 'snapshot',
    snapshot: {
      version: 1,
      status: 'running',
      deadlineEpochMs: 10_000,
      durationSeconds: 10,
      activeDurationSeconds: 10,
      transitionOccurredAtEpochMs: 0
    }
  });
  const timer = createRestTimerStore({ now: () => 15_000 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 15_000 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots,
    context: { isWorkoutActive: () => true },
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined,
      hasDelivered: () => true
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.equal(completions, 0);
  assert.equal(snapshots.clears(), 1);
  coordinator.stop();
});

test('startup clears invalid workout context with pending delivery', async () => {
  let cancellations = 0;
  const snapshots = snapshotStore({
    kind: 'snapshot',
    snapshot: {
      version: 1,
      status: 'running',
      deadlineEpochMs: 91_000,
      durationSeconds: 90,
      activeDurationSeconds: 90,
      transitionOccurredAtEpochMs: 1_000,
      context: { workoutId: 'completed-workout' }
    }
  });
  const timer = createRestTimerStore({ now: () => 2_000 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 2_000 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots,
    context: { isWorkoutActive: () => false },
    notifications: {
      schedule: () => undefined,
      cancel: () => {
        cancellations += 1;
      },
      hasDelivered: () => false
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(snapshots.clears(), 1);
  assert.equal(cancellations, 1);
});

test('startup removes pending delivery for a corrupt snapshot', async () => {
  let cancellations = 0;
  const timer = createRestTimerStore({ now: () => 2_000 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 2_000 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots: snapshotStore({ kind: 'invalid' }),
    notifications: {
      schedule: () => undefined,
      cancel: () => {
        cancellations += 1;
      }
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();

  assert.equal(timer.getState().status, 'idle');
  assert.equal(cancellations, 1);
});

test('snapshot write failure does not interrupt an in-session timer', async () => {
  const deadlines: number[] = [];
  const errors: string[] = [];
  const timer = createRestTimerStore({ now: () => 1_000 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 1_000 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots: {
      read: () => ({ kind: 'empty' }),
      write: () => {
        throw new Error('disk unavailable');
      },
      clear: () => undefined
    },
    context: { isWorkoutActive: () => true },
    notifications: {
      schedule: ({ deadlineEpochMs }) => {
        deadlines.push(deadlineEpochMs);
      },
      cancel: () => undefined,
      hasDelivered: () => false
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    },
    onError: (_error, operation) => errors.push(operation)
  });

  coordinator.start();
  assert.equal(timer.getState().start(90), true);
  await coordinator.settled();

  assert.equal(timer.getState().status, 'running');
  assert.deepEqual(deadlines, [91_000]);
  assert.deepEqual(errors, ['persist']);
  coordinator.stop();
});

test('coordinator persists each new pause time for the 24-hour age', async () => {
  let now = 1_000;
  const snapshots = snapshotStore();
  const timer = createRestTimerStore({ now: () => now });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => now },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined
    },
    feedback: {
      complete: () => undefined,
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  coordinator.start();
  timer.getState().start(90);
  now = 2_000;
  timer.getState().pause();
  now = 3_000;
  timer.getState().resume();
  now = 4_000;
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
  let deliveredLookups = 0;
  let completions = 0;
  const snapshots = snapshotStore({
    kind: 'snapshot',
    snapshot: {
      version: 1,
      status: 'running',
      deadlineEpochMs: 10_000,
      durationSeconds: 10,
      activeDurationSeconds: 10,
      transitionOccurredAtEpochMs: 0
    }
  });
  const timer = createRestTimerStore({ now: () => 15_001 });
  const coordinator = createRestTimerCoordinator({
    timer,
    clock: { now: () => 15_001 },
    appState: appStateSource(),
    scheduler: idleScheduler,
    snapshots,
    notifications: {
      schedule: () => undefined,
      cancel: () => undefined,
      hasDelivered: () => {
        deliveredLookups += 1;

        return false;
      }
    },
    feedback: {
      complete: () => {
        completions += 1;
      },
      cancel: () => undefined,
      stop: () => undefined
    }
  });

  await coordinator.restore();
  coordinator.start();
  await coordinator.settled();

  assert.equal(snapshots.clears(), 1);
  assert.equal(deliveredLookups, 0);
  assert.equal(completions, 0);
  coordinator.stop();
});

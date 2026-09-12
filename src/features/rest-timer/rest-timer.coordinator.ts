import type {
  RestTimerContext,
  RestTimerState,
  RestTimerTransition
} from '@/src/features/rest-timer/rest-timer.store';
import type {
  RestTimerRuntimeSnapshot,
  RestTimerSnapshotStore
} from '@/src/features/rest-timer/rest-timer-runtime-snapshot';

export type RestTimerAppState =
  | 'active'
  | 'inactive'
  | 'background'
  | 'extension'
  | 'unknown';

interface RestTimerStorePort {
  getState(): RestTimerState;
  subscribe(
    listener: (state: RestTimerState, previousState: RestTimerState) => void
  ): () => void;
}

interface RestTimerAppStatePort {
  current(): RestTimerAppState;
  subscribe(listener: (state: RestTimerAppState) => void): () => void;
}

interface RestTimerScheduler {
  every(operation: () => void, intervalMs: number): () => void;
}

export interface RestTimerNotificationPort {
  schedule(input: {
    deadlineEpochMs: number;
    context: RestTimerContext;
  }): void | Promise<void>;
  cancel(): void | Promise<void>;
  hasDelivered?(): boolean | Promise<boolean>;
}

export interface RestTimerFeedbackPort {
  complete(input: { showMessage: boolean }): void | Promise<void>;
  cancel(): void | Promise<void>;
  acknowledge?(): void | Promise<void>;
  stop(): void | Promise<void>;
}

interface RestTimerCoordinatorDependencies {
  timer: RestTimerStorePort;
  clock: { now(): number };
  appState: RestTimerAppStatePort;
  scheduler: RestTimerScheduler;
  notifications: RestTimerNotificationPort;
  feedback: RestTimerFeedbackPort;
  snapshots?: RestTimerSnapshotStore;
  context?: {
    isWorkoutActive(workoutId: string): boolean;
  };
  onError?: (
    error: unknown,
    operation:
      | 'schedule'
      | 'cancel'
      | 'complete'
      | 'acknowledge'
      | 'stop'
      | 'persist'
      | 'restore'
  ) => void;
}

const REST_TIMER_TICK_INTERVAL_MS = 500;
const MAX_PAUSED_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000;
const RECENT_EXPIRY_WINDOW_MS = 5_000;

function snapshotForTransition(
  transition: RestTimerTransition,
  state: RestTimerState
): RestTimerRuntimeSnapshot | null {
  if (state.status === 'running' && state.endTime !== null) {
    return {
      version: 1,
      status: 'running',
      deadlineEpochMs: state.endTime,
      durationSeconds: state.durationSeconds,
      activeDurationSeconds: state.activeDurationSeconds,
      transitionOccurredAtEpochMs: transition.occurredAtEpochMs,
      ...(Object.keys(state.context).length > 0
        ? { context: state.context }
        : {})
    };
  }

  if (state.status === 'paused' && state.pausedRemainingMs !== null) {
    return {
      version: 1,
      status: 'paused',
      remainingMs: state.pausedRemainingMs,
      durationSeconds: state.durationSeconds,
      activeDurationSeconds: state.activeDurationSeconds,
      pausedAtEpochMs: transition.occurredAtEpochMs,
      ...(Object.keys(state.context).length > 0
        ? { context: state.context }
        : {})
    };
  }

  return null;
}

export function createRestTimerCoordinator(
  dependencies: RestTimerCoordinatorDependencies
) {
  let appState = dependencies.appState.current();
  let latestTransitionSequence = 0;
  let operationTail = Promise.resolve();
  let unsubscribeTimer: (() => void) | undefined;
  let unsubscribeAppState: (() => void) | undefined;
  let cancelTimerTicks: (() => void) | undefined;
  let started = false;
  let restored = false;
  let pendingStartupCompletion = false;
  let startupCompletionLifecycle: number | undefined;
  let suppressedCompletionSequence: number | undefined;
  let lifecycleGeneration = 0;

  const runSerialized = (operation: () => void | Promise<void>) => {
    operationTail = operationTail.then(operation, operation);
  };

  const runTransitionOperation = (
    transition: RestTimerTransition,
    operationName: 'schedule' | 'cancel' | 'complete',
    operation: (isCurrent: () => boolean) => void | Promise<void>
  ) => {
    const operationLifecycle = lifecycleGeneration;
    const isCurrent = () =>
      started &&
      operationLifecycle === lifecycleGeneration &&
      transition.sequence === latestTransitionSequence;

    runSerialized(async () => {
      if (!isCurrent()) {
        return;
      }

      try {
        await operation(isCurrent);
      } catch (error) {
        if (isCurrent()) {
          dependencies.onError?.(error, operationName);
        }
      }
    });
  };

  const observeTransition = (
    transition: RestTimerTransition,
    state: RestTimerState
  ) => {
    latestTransitionSequence = transition.sequence;

    if (transition.kind !== 'hydrate' && dependencies.snapshots) {
      try {
        const snapshot = snapshotForTransition(transition, state);

        if (snapshot) {
          dependencies.snapshots.write(snapshot);
        } else {
          dependencies.snapshots.clear();
        }
      } catch (error) {
        dependencies.onError?.(error, 'persist');
      }
    }

    if (
      transition.kind === 'complete' &&
      transition.sequence === suppressedCompletionSequence
    ) {
      suppressedCompletionSequence = undefined;

      return;
    }

    if (
      transition.kind === 'start' ||
      transition.kind === 'reschedule' ||
      transition.kind === 'resume' ||
      (transition.kind === 'hydrate' && state.status === 'running')
    ) {
      if (state.status !== 'running' || state.endTime === null) {
        return;
      }

      const deadlineEpochMs = state.endTime;
      const context = state.context;

      runTransitionOperation(transition, 'schedule', () =>
        dependencies.notifications.schedule({ deadlineEpochMs, context })
      );

      return;
    }

    if (
      transition.kind === 'pause' ||
      (transition.kind === 'hydrate' && state.status !== 'running')
    ) {
      runTransitionOperation(transition, 'cancel', () =>
        dependencies.notifications.cancel()
      );

      return;
    }

    if (transition.kind === 'cancel') {
      runTransitionOperation(transition, 'cancel', async isCurrent => {
        await dependencies.notifications.cancel();

        if (isCurrent()) {
          await dependencies.feedback.cancel();
        }
      });

      return;
    }

    if (transition.kind === 'complete' && appState === 'active') {
      runTransitionOperation(transition, 'complete', () =>
        dependencies.feedback.complete({ showMessage: !state.isSheetOpen })
      );
    }
  };

  const stopFeedback = () => {
    const operationLifecycle = lifecycleGeneration;

    runSerialized(async () => {
      if (!started || operationLifecycle !== lifecycleGeneration) {
        return;
      }

      try {
        await dependencies.feedback.stop();
      } catch (error) {
        dependencies.onError?.(error, 'stop');
      }
    });
  };

  const completePendingStartup = () => {
    if (
      !pendingStartupCompletion ||
      startupCompletionLifecycle === lifecycleGeneration ||
      appState !== 'active'
    ) {
      return;
    }

    const operationLifecycle = lifecycleGeneration;
    startupCompletionLifecycle = operationLifecycle;

    runSerialized(async () => {
      if (!started || operationLifecycle !== lifecycleGeneration) {
        if (startupCompletionLifecycle === operationLifecycle) {
          startupCompletionLifecycle = undefined;
        }

        return;
      }

      pendingStartupCompletion = false;
      startupCompletionLifecycle = undefined;

      try {
        await dependencies.feedback.complete({ showMessage: true });
      } catch (error) {
        dependencies.onError?.(error, 'complete');
      }
    });
  };

  const clearSnapshot = () => {
    try {
      dependencies.snapshots?.clear();
    } catch (error) {
      dependencies.onError?.(error, 'persist');
    }
  };

  const cancelNotification = async () => {
    try {
      await dependencies.notifications.cancel();
    } catch (error) {
      dependencies.onError?.(error, 'cancel');
    }
  };

  const reconcileForeground = () => {
    appState = 'active';
    const now = dependencies.clock.now();
    const state = dependencies.timer.getState();

    if (
      state.status !== 'running' ||
      state.endTime === null ||
      state.endTime > now
    ) {
      state.tick(now);
      completePendingStartup();

      return;
    }

    const expiryAgeMs = now - state.endTime;
    suppressedCompletionSequence = (state.transition?.sequence ?? 0) + 1;
    state.tick(now);

    if (expiryAgeMs > RECENT_EXPIRY_WINDOW_MS) {
      return;
    }

    const completionSequence =
      dependencies.timer.getState().transition?.sequence;
    const operationLifecycle = lifecycleGeneration;

    runSerialized(async () => {
      let delivered: boolean;

      try {
        delivered =
          (await dependencies.notifications.hasDelivered?.()) ?? false;
      } catch (error) {
        dependencies.onError?.(error, 'restore');

        return;
      }

      const currentState = dependencies.timer.getState();

      if (
        delivered ||
        !started ||
        operationLifecycle !== lifecycleGeneration ||
        appState !== 'active' ||
        currentState.status !== 'idle' ||
        currentState.transition?.sequence !== completionSequence
      ) {
        return;
      }

      try {
        await dependencies.feedback.complete({
          showMessage: !currentState.isSheetOpen
        });
      } catch (error) {
        dependencies.onError?.(error, 'complete');
      }
    });
  };

  return {
    async restore() {
      if (restored) {
        return;
      }

      restored = true;

      if (!dependencies.snapshots) {
        return;
      }

      let result;

      try {
        result = dependencies.snapshots.read();
      } catch (error) {
        dependencies.onError?.(error, 'restore');
        clearSnapshot();
        await cancelNotification();

        return;
      }

      if (result.kind === 'empty') {
        return;
      }

      if (result.kind === 'invalid') {
        await cancelNotification();

        return;
      }

      const { snapshot } = result;
      const workoutId = snapshot.context?.workoutId;
      let hasValidWorkoutContext = true;

      if (workoutId && dependencies.context) {
        try {
          hasValidWorkoutContext =
            dependencies.context.isWorkoutActive(workoutId);
        } catch (error) {
          hasValidWorkoutContext = false;
          dependencies.onError?.(error, 'restore');
        }
      }

      if (!hasValidWorkoutContext) {
        clearSnapshot();
        await cancelNotification();

        return;
      }

      const now = dependencies.clock.now();

      if (snapshot.status === 'paused') {
        if (now - snapshot.pausedAtEpochMs > MAX_PAUSED_SNAPSHOT_AGE_MS) {
          clearSnapshot();
          await cancelNotification();

          return;
        }

        dependencies.timer.getState().hydrate({
          status: 'paused',
          remainingMs: snapshot.remainingMs,
          durationSeconds: snapshot.durationSeconds,
          activeDurationSeconds: snapshot.activeDurationSeconds,
          context: snapshot.context
        });

        return;
      }

      if (snapshot.deadlineEpochMs > now) {
        dependencies.timer.getState().hydrate({
          status: 'running',
          endTime: snapshot.deadlineEpochMs,
          durationSeconds: snapshot.durationSeconds,
          activeDurationSeconds: snapshot.activeDurationSeconds,
          context: snapshot.context
        });

        return;
      }

      clearSnapshot();

      if (now - snapshot.deadlineEpochMs > RECENT_EXPIRY_WINDOW_MS) {
        return;
      }

      try {
        const delivered =
          (await dependencies.notifications.hasDelivered?.()) ?? false;

        pendingStartupCompletion = !delivered;
      } catch (error) {
        dependencies.onError?.(error, 'restore');
      }
    },
    start() {
      if (started) {
        return;
      }

      started = true;
      lifecycleGeneration += 1;
      appState = dependencies.appState.current();
      const initialState = dependencies.timer.getState();

      unsubscribeTimer = dependencies.timer.subscribe(
        (state, previousState) => {
          if (previousState.isSheetOpen && !state.isSheetOpen) {
            stopFeedback();
          }

          if (
            state.transition &&
            state.transition.sequence !== previousState.transition?.sequence
          ) {
            observeTransition(state.transition, state);
          }
        }
      );
      unsubscribeAppState = dependencies.appState.subscribe(nextState => {
        if (nextState === 'active') {
          reconcileForeground();

          return;
        }

        appState = nextState;
        stopFeedback();
      });
      cancelTimerTicks = dependencies.scheduler.every(() => {
        dependencies.timer.getState().tick(dependencies.clock.now());
      }, REST_TIMER_TICK_INTERVAL_MS);

      if (
        initialState.transition?.kind === 'hydrate' &&
        initialState.transition.sequence > latestTransitionSequence
      ) {
        observeTransition(initialState.transition, initialState);
      }

      completePendingStartup();
    },
    stop() {
      if (!started) {
        return;
      }

      started = false;
      lifecycleGeneration += 1;
      unsubscribeTimer?.();
      unsubscribeAppState?.();
      cancelTimerTicks?.();
      unsubscribeTimer = undefined;
      unsubscribeAppState = undefined;
      cancelTimerTicks = undefined;
    },
    settled() {
      return operationTail;
    },
    acknowledgeNotificationCompletion() {
      const state = dependencies.timer.getState();
      const operationLifecycle = lifecycleGeneration;

      if (
        state.status === 'running' &&
        state.endTime !== null &&
        state.endTime <= dependencies.clock.now()
      ) {
        suppressedCompletionSequence = (state.transition?.sequence ?? 0) + 1;
        state.tick(dependencies.clock.now());
      }

      runSerialized(async () => {
        if (!started || operationLifecycle !== lifecycleGeneration) {
          return;
        }

        try {
          await (dependencies.feedback.acknowledge?.() ??
            dependencies.feedback.stop());
        } catch (error) {
          dependencies.onError?.(error, 'acknowledge');
        }
      });
    }
  };
}

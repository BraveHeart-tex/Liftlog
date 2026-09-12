import type {
  RestTimerContext,
  RestTimerState,
  RestTimerTransition
} from '@/src/features/rest-timer/rest-timer.store';

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
  onError?: (
    error: unknown,
    operation: 'schedule' | 'cancel' | 'complete' | 'acknowledge' | 'stop'
  ) => void;
}

const REST_TIMER_TICK_INTERVAL_MS = 500;

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

  return {
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
        appState = nextState;

        if (nextState === 'active') {
          dependencies.timer.getState().tick(dependencies.clock.now());

          return;
        }

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

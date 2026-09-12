import {
  MAX_REST_TIMER_SECONDS,
  MIN_REST_TIMER_SECONDS
} from '@/src/features/rest-timer/rest-timer.constants';
import { create, type StateCreator } from 'zustand';

const DEFAULT_REST_TIMER_SECONDS = 90;

export { MAX_REST_TIMER_SECONDS, MIN_REST_TIMER_SECONDS };

export type RestTimerStatus = 'idle' | 'running' | 'paused';

export interface RestTimerClock {
  now(): number;
}

export interface RestTimerTransition {
  sequence: number;
  kind:
    | 'start'
    | 'reschedule'
    | 'pause'
    | 'resume'
    | 'cancel'
    | 'complete'
    | 'hydrate';
  occurredAtEpochMs: number;
}

export interface RestTimerContext {
  workoutId?: string;
  workoutExerciseId?: string;
  exerciseName?: string;
}

export type RestTimerHydration =
  | {
      status: 'running';
      endTime: number;
      durationSeconds: number;
      activeDurationSeconds: number;
      context?: RestTimerContext;
    }
  | {
      status: 'paused';
      remainingMs: number;
      durationSeconds: number;
      activeDurationSeconds: number;
      context?: RestTimerContext;
    };

export interface RestTimerState {
  status: RestTimerStatus;
  endTime: number | null;
  pausedRemainingMs: number | null;
  durationSeconds: number;
  secondsRemaining: number;
  activeDurationSeconds: number;
  context: RestTimerContext;
  transition: RestTimerTransition | null;
  isSheetOpen: boolean;
  setSheetOpen: (isOpen: boolean) => void;
  syncDefaultDuration: (defaultDuration: number) => void;
  syncOnOpen: (defaultDuration: number) => void;
  hydrate: (hydration: RestTimerHydration) => void;
  tick: (now?: number) => void;
  start: (durationSeconds: number, context?: RestTimerContext) => boolean;
  addTime: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => boolean;
  cancelForWorkout: (workoutId: string) => boolean;
}

function clampRestTimerDuration(value: number) {
  return Math.max(
    MIN_REST_TIMER_SECONDS,
    Math.min(MAX_REST_TIMER_SECONDS, value)
  );
}

function normalizeRestTimerInput(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_REST_TIMER_SECONDS, Math.floor(value)));
}

function getSecondsRemaining(state: RestTimerState, now: number) {
  if (state.status !== 'running' || state.endTime === null) {
    return Math.ceil(
      (state.pausedRemainingMs ?? state.durationSeconds * 1000) / 1000
    );
  }

  return Math.max(0, Math.ceil((state.endTime - now) / 1000));
}

function nextTransition(
  state: RestTimerState,
  kind: RestTimerTransition['kind'],
  occurredAtEpochMs: number
): RestTimerTransition {
  return {
    sequence: (state.transition?.sequence ?? 0) + 1,
    kind,
    occurredAtEpochMs
  };
}

function completedTimerState(
  state: RestTimerState,
  occurredAtEpochMs: number
): Partial<RestTimerState> {
  return {
    status: 'idle',
    endTime: null,
    pausedRemainingMs: null,
    secondsRemaining: state.durationSeconds,
    activeDurationSeconds: state.durationSeconds,
    transition: nextTransition(state, 'complete', occurredAtEpochMs)
  };
}

function createRestTimerState(
  clock: RestTimerClock
): StateCreator<RestTimerState> {
  return (set, get) => ({
    status: 'idle',
    endTime: null,
    pausedRemainingMs: null,
    durationSeconds: DEFAULT_REST_TIMER_SECONDS,
    secondsRemaining: DEFAULT_REST_TIMER_SECONDS,
    activeDurationSeconds: DEFAULT_REST_TIMER_SECONDS,
    context: {},
    transition: null,
    isSheetOpen: false,
    setSheetOpen: isSheetOpen => {
      set({ isSheetOpen });
    },
    syncDefaultDuration: defaultDuration => {
      if (get().status !== 'idle') {
        return;
      }

      const durationSeconds = clampRestTimerDuration(defaultDuration);

      set({
        durationSeconds,
        pausedRemainingMs: null,
        secondsRemaining: durationSeconds,
        activeDurationSeconds: durationSeconds
      });
    },
    syncOnOpen: defaultDuration => {
      const state = get();

      if (state.status === 'idle') {
        const durationSeconds = clampRestTimerDuration(defaultDuration);

        set({
          durationSeconds,
          pausedRemainingMs: null,
          secondsRemaining: durationSeconds,
          activeDurationSeconds: durationSeconds
        });

        return;
      }

      set({ secondsRemaining: getSecondsRemaining(state, clock.now()) });
    },
    hydrate: hydration => {
      const state = get();
      const context = hydration.context ?? {};
      const now = clock.now();

      if (hydration.status === 'running') {
        set({
          status: 'running',
          endTime: hydration.endTime,
          pausedRemainingMs: null,
          durationSeconds: hydration.durationSeconds,
          secondsRemaining: Math.max(
            0,
            Math.ceil((hydration.endTime - now) / 1000)
          ),
          activeDurationSeconds: hydration.activeDurationSeconds,
          context,
          transition: nextTransition(state, 'hydrate', now)
        });

        return;
      }

      set({
        status: 'paused',
        endTime: null,
        pausedRemainingMs: hydration.remainingMs,
        durationSeconds: hydration.durationSeconds,
        secondsRemaining: Math.max(0, Math.ceil(hydration.remainingMs / 1000)),
        activeDurationSeconds: hydration.activeDurationSeconds,
        context,
        transition: nextTransition(state, 'hydrate', now)
      });
    },
    tick: (now = clock.now()) => {
      const state = get();
      const secondsRemaining = getSecondsRemaining(state, now);

      if (state.status === 'running' && secondsRemaining <= 0) {
        set(completedTimerState(state, now));

        return;
      }

      if (state.secondsRemaining !== secondsRemaining) {
        set({ secondsRemaining });
      }
    },
    start: (durationSeconds, context = {}) => {
      const totalSeconds = normalizeRestTimerInput(durationSeconds);

      if (totalSeconds < MIN_REST_TIMER_SECONDS) {
        return false;
      }

      const state = get();
      const now = clock.now();

      set({
        status: 'running',
        endTime: now + totalSeconds * 1000,
        pausedRemainingMs: null,
        durationSeconds: totalSeconds,
        secondsRemaining: totalSeconds,
        activeDurationSeconds: totalSeconds,
        context,
        transition: nextTransition(state, 'start', now)
      });

      return true;
    },
    addTime: seconds => {
      const state = get();
      const addedSeconds = normalizeRestTimerInput(seconds);

      if (
        addedSeconds <= 0 ||
        (state.status !== 'running' && state.status !== 'paused')
      ) {
        return;
      }

      const now = clock.now();
      const currentRemainingMs =
        state.status === 'running' && state.endTime !== null
          ? Math.max(0, state.endTime - now)
          : Math.max(0, state.pausedRemainingMs ?? 0);
      const remainingMs = Math.min(
        MAX_REST_TIMER_SECONDS * 1000,
        currentRemainingMs + addedSeconds * 1000
      );

      set({
        endTime: state.status === 'running' ? now + remainingMs : null,
        pausedRemainingMs: state.status === 'paused' ? remainingMs : null,
        secondsRemaining: Math.ceil(remainingMs / 1000),
        activeDurationSeconds: Math.min(
          MAX_REST_TIMER_SECONDS,
          state.activeDurationSeconds + addedSeconds
        ),
        transition: nextTransition(state, 'reschedule', now)
      });
    },
    pause: () => {
      const state = get();

      if (state.status !== 'running' || state.endTime === null) {
        return;
      }

      const now = clock.now();
      const pausedRemainingMs = Math.max(0, state.endTime - now);
      const secondsRemaining =
        pausedRemainingMs <= 0 ? 0 : Math.ceil(pausedRemainingMs / 1000);

      set({
        status: 'paused',
        endTime: null,
        pausedRemainingMs,
        secondsRemaining,
        transition: nextTransition(state, 'pause', now)
      });
    },
    resume: () => {
      const state = get();

      if (state.status !== 'paused') {
        return;
      }

      const remainingMs =
        state.pausedRemainingMs ?? state.secondsRemaining * 1000;

      if (remainingMs <= 0) {
        const now = clock.now();

        set(completedTimerState(state, now));

        return;
      }

      const now = clock.now();

      set({
        status: 'running',
        endTime: now + remainingMs,
        pausedRemainingMs: null,
        secondsRemaining: Math.ceil(remainingMs / 1000),
        activeDurationSeconds: state.activeDurationSeconds,
        transition: nextTransition(state, 'resume', now)
      });
    },
    cancel: () => {
      const state = get();

      if (state.status === 'idle') {
        return false;
      }

      set({
        status: 'idle',
        endTime: null,
        pausedRemainingMs: null,
        secondsRemaining: state.durationSeconds,
        activeDurationSeconds: state.durationSeconds,
        context: {},
        transition: nextTransition(state, 'cancel', clock.now())
      });

      return true;
    },
    cancelForWorkout: workoutId => {
      const state = get();

      if (state.context.workoutId !== workoutId) {
        return false;
      }

      state.cancel();

      return true;
    }
  });
}

export function createRestTimerStore(
  clock: RestTimerClock = { now: Date.now }
) {
  return create<RestTimerState>(createRestTimerState(clock));
}

export const useRestTimerStore = createRestTimerStore();

import { create } from 'zustand';

export const MIN_REST_TIMER_SECONDS = 10;
export const MAX_REST_TIMER_SECONDS = 3600;
export const DEFAULT_REST_TIMER_SECONDS = 90;
const REST_TIMER_STEP_SECONDS = 10;

export type RestTimerStatus = 'idle' | 'running' | 'paused';

interface RestTimerState {
  status: RestTimerStatus;
  endTime: number | null;
  pausedRemainingMs: number | null;
  durationSeconds: number;
  secondsRemaining: number;
  activeDurationSeconds: number;
  inputValue: number;
  completionCount: number;
  syncDefaultDuration: (defaultDuration: number) => void;
  syncOnOpen: (defaultDuration: number) => void;
  tick: (now?: number) => void;
  setInputFromText: (value: string) => void;
  commitInput: (fallbackDuration: number) => void;
  decreaseInput: () => void;
  increaseInput: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

export function clampRestTimerDuration(value: number) {
  return Math.max(
    MIN_REST_TIMER_SECONDS,
    Math.min(MAX_REST_TIMER_SECONDS, value)
  );
}

function getSecondsRemaining(state: RestTimerState, now = Date.now()) {
  if (state.status !== 'running' || state.endTime === null) {
    return Math.ceil(
      (state.pausedRemainingMs ?? state.durationSeconds * 1000) / 1000
    );
  }

  return Math.max(0, Math.ceil((state.endTime - now) / 1000));
}

function setDurationInput(
  state: RestTimerState,
  inputValue: number
): Partial<RestTimerState> {
  if (state.status !== 'paused') {
    return { inputValue };
  }

  const remaining = clampRestTimerDuration(inputValue);

  return {
    inputValue,
    pausedRemainingMs: remaining * 1000,
    secondsRemaining: remaining,
    activeDurationSeconds: remaining
  };
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  status: 'idle',
  endTime: null,
  pausedRemainingMs: null,
  durationSeconds: DEFAULT_REST_TIMER_SECONDS,
  secondsRemaining: DEFAULT_REST_TIMER_SECONDS,
  activeDurationSeconds: DEFAULT_REST_TIMER_SECONDS,
  inputValue: DEFAULT_REST_TIMER_SECONDS,
  completionCount: 0,
  syncDefaultDuration: defaultDuration => {
    if (get().status !== 'idle') {
      return;
    }

    const durationSeconds = clampRestTimerDuration(defaultDuration);

    set({
      durationSeconds,
      pausedRemainingMs: null,
      secondsRemaining: durationSeconds,
      activeDurationSeconds: durationSeconds,
      inputValue: durationSeconds
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
        activeDurationSeconds: durationSeconds,
        inputValue: durationSeconds
      });

      return;
    }

    set({ secondsRemaining: getSecondsRemaining(state) });
  },
  tick: (now = Date.now()) => {
    const state = get();
    const secondsRemaining = getSecondsRemaining(state, now);

    if (state.status === 'running' && secondsRemaining <= 0) {
      set({
        status: 'idle',
        endTime: null,
        pausedRemainingMs: null,
        secondsRemaining: state.durationSeconds,
        activeDurationSeconds: state.durationSeconds,
        inputValue: state.durationSeconds,
        completionCount: state.completionCount + 1
      });

      return;
    }

    if (state.secondsRemaining !== secondsRemaining) {
      set({ secondsRemaining });
    }
  },
  setInputFromText: value => {
    if (value.trim().length === 0) {
      set({ inputValue: 0 });

      return;
    }

    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) {
      set({ inputValue: 0 });

      return;
    }

    const parsed = Number(digits);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      set({ inputValue: 0 });

      return;
    }

    set(state =>
      setDurationInput(state, Math.min(MAX_REST_TIMER_SECONDS, parsed))
    );
  },
  commitInput: fallbackDuration => {
    const { inputValue } = get();
    const nextValue =
      Number.isFinite(inputValue) && inputValue > 0
        ? clampRestTimerDuration(inputValue)
        : clampRestTimerDuration(fallbackDuration);

    set(state => setDurationInput(state, nextValue));
  },
  decreaseInput: () => {
    set(state =>
      setDurationInput(
        state,
        Math.max(
          MIN_REST_TIMER_SECONDS,
          state.inputValue - REST_TIMER_STEP_SECONDS
        )
      )
    );
  },
  increaseInput: () => {
    set(state =>
      setDurationInput(
        state,
        Math.min(
          MAX_REST_TIMER_SECONDS,
          state.inputValue + REST_TIMER_STEP_SECONDS
        )
      )
    );
  },
  start: () => {
    const totalSeconds = clampRestTimerDuration(get().inputValue);

    set({
      status: 'running',
      endTime: Date.now() + totalSeconds * 1000,
      pausedRemainingMs: null,
      durationSeconds: totalSeconds,
      secondsRemaining: totalSeconds,
      activeDurationSeconds: totalSeconds,
      inputValue: totalSeconds
    });
  },
  pause: () => {
    const state = get();

    if (state.status !== 'running' || state.endTime === null) {
      return;
    }

    const pausedRemainingMs = Math.max(0, state.endTime - Date.now());
    const secondsRemaining = Math.ceil(pausedRemainingMs / 1000);

    set({
      status: 'paused',
      endTime: null,
      pausedRemainingMs,
      secondsRemaining,
      inputValue: secondsRemaining
    });
  },
  resume: () => {
    const state = get();
    const resumeSeconds = clampRestTimerDuration(
      state.status === 'paused' && state.pausedRemainingMs !== null
        ? Math.ceil(state.pausedRemainingMs / 1000)
        : state.inputValue
    );

    set({
      status: 'running',
      endTime: Date.now() + resumeSeconds * 1000,
      pausedRemainingMs: null,
      secondsRemaining: resumeSeconds,
      activeDurationSeconds: resumeSeconds,
      inputValue: resumeSeconds
    });
  },
  cancel: () => {
    const { durationSeconds } = get();

    set({
      status: 'idle',
      endTime: null,
      pausedRemainingMs: null,
      secondsRemaining: durationSeconds,
      activeDurationSeconds: durationSeconds,
      inputValue: durationSeconds
    });
  }
}));

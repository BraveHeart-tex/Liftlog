import { create } from 'zustand';

export const MIN_REST_TIMER_SECONDS = 10;
const MAX_REST_TIMER_SECONDS = 3600;
const DEFAULT_REST_TIMER_SECONDS = 90;

type RestTimerStatus = 'idle' | 'running' | 'paused';

interface RestTimerState {
  status: RestTimerStatus;
  endTime: number | null;
  pausedRemainingMs: number | null;
  durationSeconds: number;
  secondsRemaining: number;
  activeDurationSeconds: number;
  inputValue: number;
  completionCount: number;
  isSheetOpen: boolean;
  setSheetOpen: (isOpen: boolean) => void;
  syncDefaultDuration: (defaultDuration: number) => void;
  syncOnOpen: (defaultDuration: number) => void;
  tick: (now?: number) => void;
  setInputDuration: (value: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
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

function getSecondsRemaining(state: RestTimerState, now = Date.now()) {
  if (state.status !== 'running' || state.endTime === null) {
    return Math.ceil(
      (state.pausedRemainingMs ?? state.durationSeconds * 1000) / 1000
    );
  }

  return Math.max(0, Math.ceil((state.endTime - now) / 1000));
}

function setInputDurationState(
  state: RestTimerState,
  inputValue: number
): Partial<RestTimerState> {
  const normalizedValue = normalizeRestTimerInput(inputValue);

  if (state.status !== 'paused') {
    return { inputValue: normalizedValue };
  }

  return {
    inputValue: normalizedValue,
    pausedRemainingMs: normalizedValue * 1000,
    secondsRemaining: normalizedValue,
    activeDurationSeconds: normalizedValue
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
  setInputDuration: value => {
    set(state => setInputDurationState(state, value));
  },
  start: () => {
    const totalSeconds = normalizeRestTimerInput(get().inputValue);

    if (totalSeconds < MIN_REST_TIMER_SECONDS) {
      return;
    }

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
    const secondsRemaining =
      pausedRemainingMs <= 0 ? 0 : Math.ceil(pausedRemainingMs / 1000);

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

    if (state.status !== 'paused') {
      return;
    }

    const resumeSeconds =
      state.pausedRemainingMs === null
        ? normalizeRestTimerInput(state.inputValue)
        : Math.ceil(state.pausedRemainingMs / 1000);

    if (resumeSeconds <= 0) {
      set({
        status: 'idle',
        endTime: null,
        pausedRemainingMs: null,
        secondsRemaining: state.durationSeconds,
        activeDurationSeconds: state.durationSeconds,
        inputValue: state.durationSeconds
      });

      return;
    }

    set({
      status: 'running',
      endTime: Date.now() + resumeSeconds * 1000,
      pausedRemainingMs: null,
      secondsRemaining: resumeSeconds,
      activeDurationSeconds: state.activeDurationSeconds,
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

import {
  MAX_REST_TIMER_SECONDS,
  MIN_REST_TIMER_SECONDS
} from '@/src/features/rest-timer/rest-timer.constants';
import type { RestTimerContext } from '@/src/features/rest-timer/rest-timer.store';

const SNAPSHOT_KEY = 'snapshot';
const SNAPSHOT_VERSION = 1;
const MAX_CONTEXT_VALUE_LENGTH = 256;

interface SnapshotStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): boolean;
}

interface RestTimerRuntimeSnapshotBase {
  version: typeof SNAPSHOT_VERSION;
  durationSeconds: number;
  activeDurationSeconds: number;
  context?: RestTimerContext;
}

export type RestTimerRuntimeSnapshot =
  | (RestTimerRuntimeSnapshotBase & {
      status: 'running';
      deadlineEpochMs: number;
      transitionOccurredAtEpochMs: number;
    })
  | (RestTimerRuntimeSnapshotBase & {
      status: 'paused';
      remainingMs: number;
      pausedAtEpochMs: number;
    });

export type RestTimerSnapshotReadResult =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'snapshot'; snapshot: RestTimerRuntimeSnapshot };

export interface RestTimerSnapshotStore {
  read(): RestTimerSnapshotReadResult;
  write(snapshot: RestTimerRuntimeSnapshot): void;
  clear(): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  requiredKeys: string[],
  optionalKeys: string[] = []
) {
  const keys = Object.keys(value);
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);

  return (
    requiredKeys.every(key => Object.hasOwn(value, key)) &&
    keys.every(key => allowedKeys.has(key))
  );
}

function isSafeTimestamp(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isDurationSeconds(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= MIN_REST_TIMER_SECONDS &&
    (value as number) <= MAX_REST_TIMER_SECONDS
  );
}

function isContextValue(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_CONTEXT_VALUE_LENGTH
  );
}

function parseContext(value: unknown): RestTimerContext | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [],
      ['workoutId', 'workoutExerciseId', 'exerciseName']
    ) ||
    Object.keys(value).length === 0
  ) {
    return null;
  }

  if (
    (value.workoutId !== undefined && !isContextValue(value.workoutId)) ||
    (value.workoutExerciseId !== undefined &&
      !isContextValue(value.workoutExerciseId)) ||
    (value.exerciseName !== undefined && !isContextValue(value.exerciseName))
  ) {
    return null;
  }

  return {
    workoutId: value.workoutId as string | undefined,
    workoutExerciseId: value.workoutExerciseId as string | undefined,
    exerciseName: value.exerciseName as string | undefined
  };
}

function parseSnapshot(value: unknown): RestTimerRuntimeSnapshot | null {
  if (!isRecord(value) || value.version !== SNAPSHOT_VERSION) {
    return null;
  }

  const context = parseContext(value.context);

  if (
    context === null ||
    !isDurationSeconds(value.durationSeconds) ||
    !isDurationSeconds(value.activeDurationSeconds)
  ) {
    return null;
  }

  if (
    value.status === 'running' &&
    hasExactKeys(
      value,
      [
        'version',
        'status',
        'deadlineEpochMs',
        'durationSeconds',
        'activeDurationSeconds',
        'transitionOccurredAtEpochMs'
      ],
      ['context']
    ) &&
    isSafeTimestamp(value.deadlineEpochMs) &&
    isSafeTimestamp(value.transitionOccurredAtEpochMs)
  ) {
    return {
      version: SNAPSHOT_VERSION,
      status: 'running',
      deadlineEpochMs: value.deadlineEpochMs,
      durationSeconds: value.durationSeconds,
      activeDurationSeconds: value.activeDurationSeconds,
      transitionOccurredAtEpochMs: value.transitionOccurredAtEpochMs,
      ...(context ? { context } : {})
    };
  }

  if (
    value.status === 'paused' &&
    hasExactKeys(
      value,
      [
        'version',
        'status',
        'remainingMs',
        'durationSeconds',
        'activeDurationSeconds',
        'pausedAtEpochMs'
      ],
      ['context']
    ) &&
    Number.isSafeInteger(value.remainingMs) &&
    (value.remainingMs as number) > 0 &&
    (value.remainingMs as number) <= MAX_REST_TIMER_SECONDS * 1000 &&
    isSafeTimestamp(value.pausedAtEpochMs)
  ) {
    return {
      version: SNAPSHOT_VERSION,
      status: 'paused',
      remainingMs: value.remainingMs as number,
      durationSeconds: value.durationSeconds,
      activeDurationSeconds: value.activeDurationSeconds,
      pausedAtEpochMs: value.pausedAtEpochMs,
      ...(context ? { context } : {})
    };
  }

  return null;
}

export function createRestTimerSnapshotStore(
  storage: SnapshotStorage
): RestTimerSnapshotStore {
  return {
    read() {
      const encoded = storage.getString(SNAPSHOT_KEY);

      if (encoded === undefined) {
        return { kind: 'empty' };
      }

      try {
        const snapshot = parseSnapshot(JSON.parse(encoded));

        if (snapshot) {
          return { kind: 'snapshot', snapshot };
        }
      } catch {
        // Invalid JSON is handled like every other malformed snapshot.
      }

      storage.remove(SNAPSHOT_KEY);

      return { kind: 'invalid' };
    },
    write(snapshot) {
      storage.set(SNAPSHOT_KEY, JSON.stringify(snapshot));
    },
    clear() {
      storage.remove(SNAPSHOT_KEY);
    }
  };
}

import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  type NewHealthStepDay,
  type Set as WorkoutSet,
  type Workout,
  workoutExercises,
  workouts
} from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import type {
  BackupSettingsV2,
  LiftLogBackupV2
} from '@/src/features/backup/backup.types';
import { createCompletedSet } from '@/src/features/workouts/set-entry/set-entry.repository';

// Fixed IDs and timestamps only, so every run produces identical rows.

/** Seeds exercise-1 (reps) inside in-progress workout-1 as workout-exercise-1. */
export function seedTrackedExercise(db: DrizzleDb) {
  db.insert(exercises)
    .values({
      id: 'exercise-1',
      name: 'Push-up',
      normalizedName: 'push-up',
      equipment: 'chest',
      trackingType: 'reps'
    })
    .run();
  db.insert(workouts)
    .values({
      id: 'workout-1',
      name: 'Workout',
      status: 'in_progress',
      startedAt: 1,
      dateKey: '1970-01-01'
    })
    .run();
  db.insert(workoutExercises)
    .values({
      id: 'workout-exercise-1',
      workoutId: 'workout-1',
      exerciseId: 'exercise-1',
      order: 0
    })
    .run();
}

/** Completes a set on workout-exercise-1 from seedTrackedExercise. */
export function createTrackedSet(
  db: DrizzleDb,
  id: string,
  reps: number,
  order: number
) {
  return createCompletedSet(db, {
    id,
    workoutExerciseId: 'workout-exercise-1',
    order,
    reps,
    completedAt: order + 1
  });
}

export function createStepDay(index: number): NewHealthStepDay {
  return {
    dateKey: `day-${index.toString().padStart(3, '0')}`,
    steps: index * 100,
    startAt: index * 1_000,
    endAt: index * 1_000 + 999,
    syncedAt: 10_000 + index
  };
}

/** An empty, valid v2 Backup envelope; overrides replace data tables and settings. */
export function createBackup(
  overrides: {
    data?: Partial<Omit<LiftLogBackupV2['data'], 'settings'>>;
    settings?: Partial<BackupSettingsV2>;
  } = {}
): LiftLogBackupV2 {
  return {
    format: 'liftlog-backup',
    schemaVersion: 2,
    createdAt: '2026-09-05T12:00:00.000Z',
    appVersion: '1.0.0',
    data: {
      exercises: [],
      workouts: [],
      workoutExercises: [],
      sets: [],
      workoutTemplates: [],
      workoutTemplateExercises: [],
      themePreference: 'system',
      ...overrides.data,
      settings: {
        weightUnit: 'kg',
        restTimerDuration: 90,
        restTimerPresets: [],
        restTimerNotificationsEnabled: false,
        healthConnectStepsEnabled: false,
        stepGoal: 10000,
        ...overrides.settings
      }
    }
  };
}

/** An exercise list row; overrides replace any field. */
export function exerciseListItem(
  overrides: Partial<ExerciseListItem> = {}
): ExerciseListItem {
  return {
    id: 'exercise-1',
    name: 'Push-up',
    equipment: null,
    trackingType: 'reps',
    primaryMuscles: null,
    secondaryMuscles: null,
    isCustom: 0,
    isArchived: 0,
    createdAt: 1,
    ...overrides
  };
}

/** A completed workout row; overrides replace any field. */
export function workoutRow(overrides: Partial<Workout> = {}): Workout {
  const startedAt = overrides.startedAt ?? 1;

  return {
    id: 'workout-1',
    name: 'Workout',
    status: 'completed',
    startedAt,
    dateKey: '2026-07-28',
    completedAt: startedAt + 1,
    notes: null,
    sourceSnapshot: null,
    sourceWorkoutId: null,
    ...overrides
  };
}

/** A completed weight-reps set row on workout-exercise-1; overrides replace any field. */
export function setRow(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  const status = overrides.status ?? 'completed';

  return {
    id: 'set-1',
    workoutExerciseId: 'workout-exercise-1',
    order: 1,
    weightKg: 50,
    reps: 8,
    distanceMeters: null,
    durationMs: null,
    durationSeconds: null,
    rpe: null,
    status,
    completedAt: status === 'completed' ? 2 : null,
    sourceSetId: null,
    ...overrides
  };
}

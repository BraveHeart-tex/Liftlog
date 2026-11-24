import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  type NewHealthStepDay,
  workoutExercises,
  workouts
} from '@/src/db/schema';
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

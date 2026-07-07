import { useDrizzle } from '@/src/components/database-provider';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import {
  updateWorkoutExerciseOrderAndSupersets,
  reorderWorkoutExercises,
  updateWorkoutExerciseSupersets
} from '@/src/features/workouts/workout.repository';
import { useCallback } from 'react';

export function useReorderWorkoutExercises(workoutId: Workout['id']) {
  const db = useDrizzle();

  return useCallback(
    (orderedWorkoutExerciseIds: WorkoutExercise['id'][]) => {
      reorderWorkoutExercises(db, workoutId, orderedWorkoutExerciseIds);
    },
    [db, workoutId]
  );
}

export function useUpdateWorkoutExerciseSupersets(workoutId: Workout['id']) {
  const db = useDrizzle();

  return useCallback(
    (rows: Pick<WorkoutExercise, 'id' | 'supersetId'>[]) => {
      updateWorkoutExerciseSupersets(db, workoutId, rows);
    },
    [db, workoutId]
  );
}

export function useSaveWorkoutExerciseEdits(workoutId: Workout['id']) {
  const db = useDrizzle();

  return useCallback(
    (rows: Pick<WorkoutExercise, 'id' | 'supersetId'>[]) => {
      updateWorkoutExerciseOrderAndSupersets(db, workoutId, rows);
    },
    [db, workoutId]
  );
}

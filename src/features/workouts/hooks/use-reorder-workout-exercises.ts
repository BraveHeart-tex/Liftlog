import { useDrizzle } from '@/src/components/database-provider';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import { reorderWorkoutExercises } from '@/src/features/workouts/repository';
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

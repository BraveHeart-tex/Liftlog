import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutExercise } from '@/src/db/schema';
import { deleteWorkoutExercise } from '@/src/features/workouts/repository';
import { useCallback } from 'react';

export function useRemoveWorkoutExercise() {
  const db = useDrizzle();

  return useCallback(
    (workoutExerciseId: WorkoutExercise['id']) => {
      deleteWorkoutExercise(db, workoutExerciseId);
    },
    [db]
  );
}

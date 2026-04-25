import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutExercise } from '@/src/db/schema';
import { createWorkoutTemplateFromWorkout } from '@/src/features/workouts/repository';
import { useCallback } from 'react';

export function useSaveWorkoutTemplate() {
  const db = useDrizzle();

  return useCallback(
    (
      name: string,
      workoutExerciseRows: Pick<WorkoutExercise, 'exerciseId' | 'order'>[]
    ) =>
      createWorkoutTemplateFromWorkout(db, {
        name,
        workoutExerciseRows
      }),
    [db]
  );
}

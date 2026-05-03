import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import { deleteWorkout } from '@/src/features/workouts/repository';
import { useCallback } from 'react';

export function useWorkoutDelete() {
  const db = useDrizzle();

  return useCallback(
    (workoutId: Workout['id']) => deleteWorkout(db, workoutId),
    [db]
  );
}

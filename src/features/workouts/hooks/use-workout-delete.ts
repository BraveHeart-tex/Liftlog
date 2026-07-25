import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import { deleteWorkout } from '@/src/features/workouts/workout.repository';
import { useCallback } from 'react';

export function useWorkoutDelete() {
  const db = useDrizzle();

  return useCallback(
    (workoutId: Workout['id']) => {
      const didDelete = deleteWorkout(db, workoutId);

      if (didDelete) {
        useRestTimerStore.getState().cancelForWorkout(workoutId);
      }

      return didDelete;
    },
    [db]
  );
}

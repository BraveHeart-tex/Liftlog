import { useDrizzle } from '@/src/providers/database-provider';
import type { Workout } from '@/src/db/schema';
import { useRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import { deleteWorkout } from '@/src/features/workouts/active/active.repository';
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

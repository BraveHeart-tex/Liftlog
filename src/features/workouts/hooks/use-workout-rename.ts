import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import { updateWorkoutName } from '@/src/features/workouts/workout.repository';
import { useCallback } from 'react';

export function useWorkoutRename() {
  const db = useDrizzle();

  return useCallback(
    ({
      workoutId,
      nextName
    }: {
      workoutId: Workout['id'];
      nextName: string;
    }) => {
      const trimmedName = nextName.trim();

      if (!trimmedName) {
        return;
      }

      return updateWorkoutName(db, workoutId, trimmedName);
    },
    [db]
  );
}

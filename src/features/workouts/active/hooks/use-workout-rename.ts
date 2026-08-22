import { useDrizzle } from '@/src/providers/database-provider';
import type { Workout } from '@/src/db/schema';
import { updateWorkoutName } from '@/src/features/workouts/active/active.repository';
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

      return updateWorkoutName(db, { id: workoutId, name: trimmedName });
    },
    [db]
  );
}

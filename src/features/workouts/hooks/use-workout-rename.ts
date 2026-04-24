import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import { updateWorkoutName } from '@/src/features/workouts/repository';
import { resolveWorkoutName } from '@/src/lib/utils/workout';
import { useCallback } from 'react';

export function useWorkoutRename() {
  const db = useDrizzle();

  return useCallback(
    (workout: Pick<Workout, 'id' | 'startedAt'>, nextName: string) => {
      return updateWorkoutName(
        db,
        workout.id,
        resolveWorkoutName(nextName, workout.startedAt)
      );
    },
    [db]
  );
}

import { getActiveWorkoutForRestTimerNotification } from '@/src/features/workouts/shared/workout.repository';
import { useDrizzle } from '@/src/providers/database-provider';
import { useMemo } from 'react';

export function useRestTimerWorkoutContextValidator() {
  const db = useDrizzle();

  return useMemo(
    () => ({
      isWorkoutActive: (workoutId: string) =>
        getActiveWorkoutForRestTimerNotification(db, workoutId) !== undefined
    }),
    [db]
  );
}

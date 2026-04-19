import { useDrizzle } from '@/src/components/database-provider';
import {
  getActiveWorkout,
  getActiveWorkoutQuery,
  getWorkouts,
  getWorkoutsQuery
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';

export function useWorkoutStart() {
  const db = useDrizzle();
  const activeWorkoutResult = useLiveWithFallback(
    () => getActiveWorkoutQuery(db),
    () => {
      const activeWorkout = getActiveWorkout(db);

      return activeWorkout ? [activeWorkout] : [];
    },
    [db]
  );
  const completedWorkoutsResult = useLiveWithFallback(
    () => getWorkoutsQuery(db),
    () => getWorkouts(db),
    [db]
  );

  const activeWorkout = activeWorkoutResult.data[0];
  const recentWorkouts = useMemo(
    () => completedWorkoutsResult.data.slice(0, 5),
    [completedWorkoutsResult.data]
  );

  return {
    activeWorkout,
    recentWorkouts
  };
}

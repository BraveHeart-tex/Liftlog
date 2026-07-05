import { useDrizzle } from '@/src/components/database-provider';
import { getRecentWorkoutsQuery } from '@/src/features/workouts/workout.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';

const RECENT_WORKOUT_LIMIT = 3;

export function useRecentWorkouts() {
  const db = useDrizzle();
  const recentWorkoutResult = useLiveWithFallback(
    getRecentWorkoutsQuery(db, RECENT_WORKOUT_LIMIT),
    [db]
  );

  return {
    recentWorkouts: recentWorkoutResult.data
  };
}

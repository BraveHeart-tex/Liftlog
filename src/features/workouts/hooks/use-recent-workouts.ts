import { useDrizzle } from '@/src/components/database-provider';
import { getRecentWorkoutsQuery } from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';

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

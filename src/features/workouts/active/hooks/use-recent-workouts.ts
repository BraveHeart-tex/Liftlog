import { useDrizzle } from '@/src/providers/database-provider';
import { getRecentWorkoutsQuery } from '@/src/features/workouts/active/active.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';

const RECENT_WORKOUT_LIMIT = 3;

export function useRecentWorkouts() {
  const db = useDrizzle();
  const recentWorkoutResult = useLiveWithFallback(
    getRecentWorkoutsQuery(db, RECENT_WORKOUT_LIMIT),
    [db],
    { operation: 'workout.getRecentWorkouts' }
  );

  return {
    recentWorkouts: recentWorkoutResult.data
  };
}

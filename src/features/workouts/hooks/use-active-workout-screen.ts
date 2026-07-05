import { useDrizzle } from '@/src/components/database-provider';
import { getActiveWorkoutQuery } from '@/src/features/workouts/workout.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';

export function useActiveWorkoutScreen() {
  const db = useDrizzle();
  const activeWorkoutResult = useLiveWithFallback(getActiveWorkoutQuery(db), [
    db
  ]);

  return {
    activeWorkout: activeWorkoutResult.data[0],
    isLoading: !activeWorkoutResult.isLive
  };
}

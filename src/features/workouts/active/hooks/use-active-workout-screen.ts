import { useDrizzle } from '@/src/providers/database-provider';
import { getActiveWorkoutQuery } from '@/src/features/workouts/active/active.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';

export function useActiveWorkoutScreen() {
  const db = useDrizzle();
  const activeWorkoutResult = useLiveWithFallback(
    getActiveWorkoutQuery(db),
    [db],
    {
      deferInitialRead: true,
      operation: 'workout.getActiveWorkout'
    }
  );

  return {
    activeWorkout: activeWorkoutResult.data[0],
    error: activeWorkoutResult.error,
    isLoading: activeWorkoutResult.isLoading
  };
}

import { useDrizzle } from '@/src/components/database-provider';
import { getHistoricalWorkoutDraftQuery } from '@/src/features/workouts/workout.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';

export function useHistoricalWorkoutDraftScreen(workoutId: string | undefined) {
  const db = useDrizzle();
  const resolvedWorkoutId = workoutId ?? '';
  const workoutResult = useLiveWithFallback(
    getHistoricalWorkoutDraftQuery(db, resolvedWorkoutId),
    [db, resolvedWorkoutId],
    { operation: 'workout.getHistoricalWorkoutDraft' }
  );

  return {
    historicalWorkout: workoutResult.data[0],
    isLoading: Boolean(workoutId) && !workoutResult.isLive
  };
}

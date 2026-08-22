import { useDrizzle } from '@/src/providers/database-provider';
import { getHistoricalWorkoutDraftQuery } from '@/src/features/workouts/history/history.repository';
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

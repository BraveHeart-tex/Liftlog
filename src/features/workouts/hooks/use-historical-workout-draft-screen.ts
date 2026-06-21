import { useDrizzle } from '@/src/components/database-provider';
import { getExercisesQuery } from '@/src/features/exercises/repository';
import { getHistoricalWorkoutDraftQuery } from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';

export function useHistoricalWorkoutDraftScreen(workoutId: string | undefined) {
  const db = useDrizzle();
  const resolvedWorkoutId = workoutId ?? '';
  const workoutResult = useLiveWithFallback(
    getHistoricalWorkoutDraftQuery(db, resolvedWorkoutId),
    [db, resolvedWorkoutId]
  );
  const exerciseResult = useLiveWithFallback(getExercisesQuery(db), [db]);

  return {
    historicalWorkout: workoutResult.data[0],
    exerciseRows: exerciseResult.data,
    isLoading: Boolean(workoutId) && !workoutResult.isLive
  };
}

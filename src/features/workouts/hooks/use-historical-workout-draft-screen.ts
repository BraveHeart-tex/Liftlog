import { useDrizzle } from '@/src/components/database-provider';
import { getExercisesQuery } from '@/src/features/exercises/exercise.repository';
import { getHistoricalWorkoutDraftQuery } from '@/src/features/workouts/workout.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';

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

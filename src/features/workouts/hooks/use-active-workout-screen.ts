import { useDrizzle } from '@/src/components/database-provider';
import { getExercisesQuery } from '@/src/features/exercises/repository';
import { getActiveWorkoutQuery } from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';

export function useActiveWorkoutScreen() {
  const db = useDrizzle();
  const activeWorkoutResult = useLiveWithFallback(getActiveWorkoutQuery(db), [
    db
  ]);
  const exerciseResult = useLiveWithFallback(getExercisesQuery(db), [db]);

  return {
    activeWorkout: activeWorkoutResult.data[0],
    exerciseRows: exerciseResult.data,
    isLoading: !activeWorkoutResult.isLive
  };
}

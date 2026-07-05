import { useDrizzle } from '@/src/components/database-provider';
import { getExercisesQuery } from '@/src/features/exercises/exercise.repository';
import {
  getHistoricalWorkoutEditDraftQuery,
  getWorkoutByIdQuery
} from '@/src/features/workouts/workout.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';

export function useHistoricalWorkoutEditScreen({
  draftWorkoutId,
  sourceWorkoutId
}: {
  draftWorkoutId: string | undefined;
  sourceWorkoutId: string | undefined;
}) {
  const db = useDrizzle();
  const resolvedDraftWorkoutId = draftWorkoutId ?? '';
  const resolvedSourceWorkoutId = sourceWorkoutId ?? '';
  const draftWorkoutResult = useLiveWithFallback(
    getHistoricalWorkoutEditDraftQuery(db, resolvedDraftWorkoutId),
    [db, resolvedDraftWorkoutId]
  );
  const sourceWorkoutResult = useLiveWithFallback(
    getWorkoutByIdQuery(db, resolvedSourceWorkoutId),
    [db, resolvedSourceWorkoutId]
  );
  const exerciseResult = useLiveWithFallback(getExercisesQuery(db), [db]);

  return {
    draftWorkout: draftWorkoutResult.data[0],
    sourceWorkout: sourceWorkoutResult.data[0],
    exerciseRows: exerciseResult.data,
    isLoading:
      Boolean(draftWorkoutId) &&
      (!draftWorkoutResult.isLive ||
        Boolean(sourceWorkoutId && !sourceWorkoutResult.isLive))
  };
}

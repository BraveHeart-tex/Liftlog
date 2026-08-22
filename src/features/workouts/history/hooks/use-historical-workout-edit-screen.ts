import { useDrizzle } from '@/src/providers/database-provider';
import {
  getHistoricalWorkoutEditDraftQuery,
  getWorkoutByIdQuery
} from '@/src/features/workouts/history/history.repository';
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
    [db, resolvedDraftWorkoutId],
    { operation: 'workout.getHistoricalWorkoutEditDraft' }
  );
  const sourceWorkoutResult = useLiveWithFallback(
    getWorkoutByIdQuery(db, resolvedSourceWorkoutId),
    [db, resolvedSourceWorkoutId],
    { operation: 'workout.getById' }
  );

  return {
    draftWorkout: draftWorkoutResult.data[0],
    sourceWorkout: sourceWorkoutResult.data[0],
    isLoading:
      Boolean(draftWorkoutId) &&
      (!draftWorkoutResult.isLive ||
        Boolean(sourceWorkoutId && !sourceWorkoutResult.isLive))
  };
}

import { useDrizzle } from '@/src/components/database-provider';
import type { Exercise, Set } from '@/src/db/schema';
import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getExerciseHistoryWorkoutsQuery
} from '@/src/features/progress/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';

function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

const MAX_HISTORY_ITEM_LIMIT = 20;

export function useExerciseHistoryTab(exerciseId: Exercise['id']) {
  const db = useDrizzle();
  const workoutResult = useLiveWithFallback(
    () => getExerciseHistoryWorkoutsQuery(db, exerciseId),
    () => getExerciseHistoryWorkoutsQuery(db, exerciseId).all(),
    [db, exerciseId]
  );
  const workoutRows = workoutResult.data;
  const workoutIds = useMemo(
    () =>
      Array.from(new Set(workoutRows.map(row => row.workout.id))).slice(0, 10),
    [workoutRows]
  );
  const workoutIdKey = useMemo(() => workoutIds.join(','), [workoutIds]);
  const setResult = useLiveWithFallback(
    () => getExerciseHistorySetsQuery(db, exerciseId, workoutIds),
    () => getExerciseHistorySetsQuery(db, exerciseId, workoutIds).all(),
    [db, exerciseId, workoutIdKey]
  );

  const history = useMemo(
    () =>
      buildExerciseHistory(workoutRows, setResult.data)
        .map(historyEntry => ({
          ...historyEntry,
          sets: getCompletedSets(historyEntry.sets)
        }))
        .filter(historyEntry => historyEntry.sets.length > 0)
        .slice(0, MAX_HISTORY_ITEM_LIMIT),
    [setResult.data, workoutRows]
  );

  return {
    history
  };
}

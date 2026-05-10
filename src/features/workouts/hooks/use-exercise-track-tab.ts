import type { Set } from '@/src/db/schema';
import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getPersonalRecordsByExercise,
  getPersonalRecordsByExerciseQuery,
  getRecentExerciseHistoryWorkoutsQuery
} from '@/src/features/progress/repository';
import { useDrizzle } from '@/src/components/database-provider';
import { useSettings } from '@/src/features/settings/hooks';
import { convertWeightToKg } from '@/src/lib/utils/weight';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo, useState } from 'react';
import { getProgressionSuggestion } from '../components/progression-suggestion-utils';
import type { WorkoutExerciseWithSets } from '../components/types';

const PROGRESSION_HISTORY_LIMIT = 4;
const weightStepByUnit = {
  kg: 2.5,
  lb: 5
};

export function useExerciseTrackTab(item: WorkoutExerciseWithSets) {
  const db = useDrizzle();
  const { weightUnit } = useSettings();
  const [editingSetId, setEditingSetId] = useState<Set['id'] | null>(null);
  const editingSet = item.sets.find(set => set.id === editingSetId);
  const exerciseId = item.workoutExercise.exerciseId;
  const prResult = useLiveWithFallback(
    () => getPersonalRecordsByExerciseQuery(db, exerciseId),
    () => getPersonalRecordsByExercise(db, exerciseId),
    [db, exerciseId]
  );
  const prSetIds = useMemo(
    () => new Set(prResult.data.map(personalRecord => personalRecord.setId)),
    [prResult.data]
  );
  const workoutResult = useLiveWithFallback(
    () =>
      getRecentExerciseHistoryWorkoutsQuery(
        db,
        exerciseId,
        PROGRESSION_HISTORY_LIMIT
      ),
    () =>
      getRecentExerciseHistoryWorkoutsQuery(
        db,
        exerciseId,
        PROGRESSION_HISTORY_LIMIT
      ).all(),
    [db, exerciseId]
  );
  const workoutRows = workoutResult.data;
  const workoutIds = useMemo(
    () => workoutRows.map(row => row.workout.id),
    [workoutRows]
  );
  const workoutIdKey = useMemo(() => workoutIds.join(','), [workoutIds]);
  const setResult = useLiveWithFallback(
    () => getExerciseHistorySetsQuery(db, exerciseId, workoutIds),
    () => getExerciseHistorySetsQuery(db, exerciseId, workoutIds).all(),
    [db, exerciseId, workoutIdKey]
  );
  const progressionSuggestion = useMemo(() => {
    const history = buildExerciseHistory(workoutRows, setResult.data).slice(
      0,
      PROGRESSION_HISTORY_LIMIT
    );
    const weightStepKg = convertWeightToKg(
      weightStepByUnit[weightUnit],
      weightUnit
    );

    return getProgressionSuggestion(history, weightStepKg);
  }, [setResult.data, weightUnit, workoutRows]);

  return {
    editingSetId,
    editingSet,
    setEditingSetId,
    prSetIds,
    progressionSuggestion
  };
}

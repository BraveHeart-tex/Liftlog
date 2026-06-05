import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getRecentExerciseHistoryWorkoutsQuery
} from '@/src/features/progress/repository';
import { resolveTrackingType } from '@/src/features/progress/tracking';
import { useDrizzle } from '@/src/components/database-provider';
import { useSettings } from '@/src/features/settings/hooks';
import { formatCompletedSets, getCompletedSets } from '@/src/lib/utils/set';
import { convertWeightToKg } from '@/src/lib/utils/weight';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';
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
  const exerciseId = item.workoutExercise.exerciseId;
  const trackingType = resolveTrackingType(item.exercise?.trackingType);
  const workoutResult = useLiveWithFallback(
    getRecentExerciseHistoryWorkoutsQuery(
      db,
      exerciseId,
      PROGRESSION_HISTORY_LIMIT
    ),
    [db, exerciseId]
  );
  const workoutRows = workoutResult.data;
  const workoutIds = useMemo(
    () => workoutRows.map(row => row.workout.id),
    [workoutRows]
  );
  const workoutIdKey = useMemo(() => workoutIds.join(','), [workoutIds]);
  const setResult = useLiveWithFallback(
    getExerciseHistorySetsQuery(db, exerciseId, workoutIds),
    [db, exerciseId, workoutIdKey]
  );
  const history = useMemo(
    () =>
      buildExerciseHistory(workoutRows, setResult.data)
        .map(entry => ({
          ...entry,
          sets: getCompletedSets(entry.sets)
        }))
        .filter(entry => entry.sets.length > 0)
        .slice(0, PROGRESSION_HISTORY_LIMIT),
    [setResult.data, workoutRows]
  );
  const progressionSuggestion = useMemo(() => {
    if (trackingType !== 'weight_reps') {
      return null;
    }

    const weightStepKg = convertWeightToKg(
      weightStepByUnit[weightUnit],
      weightUnit
    );

    return getProgressionSuggestion(history, weightStepKg);
  }, [history, trackingType, weightUnit]);
  const historyPreview = useMemo(() => {
    const latestHistory = history[0];

    if (!latestHistory) {
      return undefined;
    }

    return {
      completedSetSummary: formatCompletedSets(
        latestHistory.sets,
        weightUnit,
        trackingType
      ),
      completedSetCount: latestHistory.sets.length
    };
  }, [history, trackingType, weightUnit]);

  return {
    trackingType,
    progressionSuggestion,
    historyPreview,
    latestHistorySets: history[0]?.sets ?? []
  };
}

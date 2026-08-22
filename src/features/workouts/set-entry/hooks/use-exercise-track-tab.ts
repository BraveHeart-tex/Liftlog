import { useDrizzle } from '@/src/providers/database-provider';
import {
  buildExerciseHistory,
  getExerciseHistoryQuery,
  mapExerciseHistoryRows
} from '@/src/features/progress/progress.repository';
import { resolveTrackingType } from '@/src/features/progress/tracking.domain';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { formatCompletedSets } from '@/src/features/workouts/shared/set-display.utils';
import { convertWeightToKg } from '@/src/lib/utils/weight.utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProgressionSuggestion } from '@/src/features/workouts/set-entry/components/progression-suggestion.utils';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/shared/workout-components.types';

const PROGRESSION_HISTORY_LIMIT = 4;

const weightStepByUnit = {
  kg: 2.5,
  lb: 5
};

type ExerciseHistory = ReturnType<typeof buildExerciseHistory>;

export function useExerciseTrackTab(
  item: WorkoutExerciseWithSets,
  historyBeforeStartedAt?: number
) {
  const db = useDrizzle();
  const { weightUnit } = useSettings();
  const exerciseId = item.workoutExercise.exerciseId;
  const trackingType = resolveTrackingType(item.exercise?.trackingType);
  const [history, setHistory] = useState<ExerciseHistory>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const isMountedRef = useRef(true);
  const refreshRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshHistory = useCallback(async () => {
    const requestId = refreshRequestIdRef.current + 1;

    refreshRequestIdRef.current = requestId;

    try {
      const historyRows = mapExerciseHistoryRows(
        await getExerciseHistoryQuery(
          db,
          exerciseId,
          PROGRESSION_HISTORY_LIMIT,
          {
            beforeStartedAt: historyBeforeStartedAt
          }
        )
      );

      if (!isMountedRef.current || refreshRequestIdRef.current !== requestId) {
        return;
      }

      setHistory(
        buildExerciseHistory(
          historyRows.visibleWorkoutRows,
          historyRows.setRows
        ).slice(0, PROGRESSION_HISTORY_LIMIT)
      );
      setIsHistoryLoading(false);
    } catch (error) {
      if (!isMountedRef.current || refreshRequestIdRef.current !== requestId) {
        return;
      }

      setIsHistoryLoading(false);
      console.error('Failed to load exercise track history', error);
    }
  }, [db, exerciseId, historyBeforeStartedAt]);

  useEffect(() => {
    isMountedRef.current = true;
    setIsHistoryLoading(true);
    void refreshHistory();

    return () => {
      refreshRequestIdRef.current += 1;
    };
  }, [refreshHistory]);

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
    isHistoryLoading,
    progressionSuggestion,
    historyPreview,
    latestHistorySets: history[0]?.sets ?? [],
    refreshHistory
  };
}

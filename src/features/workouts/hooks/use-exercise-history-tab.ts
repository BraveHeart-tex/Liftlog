import { useDrizzle } from '@/src/components/database-provider';
import type { Exercise, Set } from '@/src/db/schema';
import { getExerciseByIdQuery } from '@/src/features/exercises/repository';
import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getExerciseHistoryWorkoutsQuery,
  getPersonalRecordsByExerciseQuery
} from '@/src/features/progress/repository';
import {
  getSetScore,
  resolveTrackingType,
  type TrackingType
} from '@/src/features/progress/tracking';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';

function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

const MAX_HISTORY_ITEM_LIMIT = 20;
const VISIBLE_WORKOUT_LIMIT = 10;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function getBestScore(sets: Set[], trackingType: TrackingType) {
  return sets.reduce((best, set) => {
    const score = getSetScore(trackingType, set);

    return Math.max(best, score ?? 0);
  }, 0);
}

export function useExerciseHistoryTab(exerciseId: Exercise['id']) {
  const db = useDrizzle();
  const exerciseResult = useLiveWithFallback(
    getExerciseByIdQuery(db, exerciseId),
    [db, exerciseId]
  );
  const trackingType = resolveTrackingType(
    exerciseResult.data[0]?.trackingType
  );
  const prResult = useLiveWithFallback(
    getPersonalRecordsByExerciseQuery(db, exerciseId),
    [db, exerciseId]
  );
  const prSetIds = useMemo(
    () => new Set(prResult.data.map(personalRecord => personalRecord.setId)),
    [prResult.data]
  );
  const workoutResult = useLiveWithFallback(
    getExerciseHistoryWorkoutsQuery(db, exerciseId),
    [db, exerciseId]
  );
  const workoutRows = workoutResult.data;
  const visibleWorkoutIds = useMemo(
    () =>
      Array.from(new Set(workoutRows.map(row => row.workout.id))).slice(
        0,
        VISIBLE_WORKOUT_LIMIT
      ),
    [workoutRows]
  );
  const progressionWorkoutIds = useMemo(() => {
    const latestWorkoutStartedAt = workoutRows[0]?.workout.startedAt;

    if (!latestWorkoutStartedAt) {
      return [];
    }

    const oldestProgressionTimestamp = latestWorkoutStartedAt - MONTH_MS * 2;

    return workoutRows
      .filter(row => row.workout.startedAt >= oldestProgressionTimestamp)
      .map(row => row.workout.id);
  }, [workoutRows]);
  const workoutIds = useMemo(
    () => Array.from(new Set([...visibleWorkoutIds, ...progressionWorkoutIds])),
    [progressionWorkoutIds, visibleWorkoutIds]
  );
  const workoutIdKey = useMemo(() => workoutIds.join(','), [workoutIds]);
  const setResult = useLiveWithFallback(
    getExerciseHistorySetsQuery(db, exerciseId, workoutIds),
    [db, exerciseId, workoutIdKey]
  );

  const history = useMemo(
    () =>
      buildExerciseHistory(
        workoutRows,
        setResult.data.filter(row => visibleWorkoutIds.includes(row.workoutId))
      )
        .map(historyEntry => ({
          ...historyEntry,
          sets: getCompletedSets(historyEntry.sets)
        }))
        .filter(historyEntry => historyEntry.sets.length > 0)
        .slice(0, MAX_HISTORY_ITEM_LIMIT),
    [setResult.data, visibleWorkoutIds, workoutRows]
  );
  const monthlyProgression = useMemo(() => {
    const latestWorkoutStartedAt = workoutRows[0]?.workout.startedAt;

    if (!latestWorkoutStartedAt) {
      return null;
    }

    const currentWindowStart = latestWorkoutStartedAt - MONTH_MS;
    const previousWindowStart = latestWorkoutStartedAt - MONTH_MS * 2;
    const setsByWorkoutId = new Map<string, Set[]>();

    for (const row of setResult.data) {
      const existingSets = setsByWorkoutId.get(row.workoutId);

      if (existingSets) {
        existingSets.push(row.set);
        continue;
      }

      setsByWorkoutId.set(row.workoutId, [row.set]);
    }

    const currentSets = workoutRows.flatMap(row =>
      row.workout.startedAt >= currentWindowStart
        ? (setsByWorkoutId.get(row.workout.id) ?? [])
        : []
    );
    const previousSets = workoutRows.flatMap(row =>
      row.workout.startedAt >= previousWindowStart &&
      row.workout.startedAt < currentWindowStart
        ? (setsByWorkoutId.get(row.workout.id) ?? [])
        : []
    );
    const currentBestScore = getBestScore(
      getCompletedSets(currentSets),
      trackingType
    );
    const previousBestScore = getBestScore(
      getCompletedSets(previousSets),
      trackingType
    );

    if (currentBestScore === 0 || previousBestScore === 0) {
      return null;
    }

    return {
      delta: currentBestScore - previousBestScore
    };
  }, [setResult.data, trackingType, workoutRows]);

  return {
    history,
    latestPersonalRecord: prResult.data[0],
    monthlyProgression,
    prSetIds,
    trackingType
  };
}

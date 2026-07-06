import { useDrizzle } from '@/src/components/database-provider';
import type { Exercise, Set } from '@/src/db/schema';
import { getExerciseByIdQuery } from '@/src/features/exercises/exercise.repository';
import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getExerciseHistoryWorkoutsSinceQuery,
  getPersonalRecordsByExerciseQuery,
  getRecentExerciseHistoryWorkoutsQuery
} from '@/src/features/progress/progress.repository';
import {
  getSetScore,
  resolveTrackingType,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo } from 'react';

function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

const MAX_HISTORY_ITEM_LIMIT = 20;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function getBestScore(sets: Set[], trackingType: TrackingType) {
  return sets.reduce((best, set) => {
    const score = getSetScore(trackingType, set);

    return Math.max(best, score ?? 0);
  }, 0);
}

export function useExerciseHistory(exerciseId: Exercise['id']) {
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
  const visibleWorkoutResult = useLiveWithFallback(
    getRecentExerciseHistoryWorkoutsQuery(
      db,
      exerciseId,
      MAX_HISTORY_ITEM_LIMIT
    ),
    [db, exerciseId]
  );
  const visibleWorkoutRows = visibleWorkoutResult.data;
  const visibleWorkoutIds = useMemo(
    () => Array.from(new Set(visibleWorkoutRows.map(row => row.workout.id))),
    [visibleWorkoutRows]
  );
  const latestWorkoutStartedAt = visibleWorkoutRows[0]?.workout.startedAt;
  const oldestProgressionTimestamp =
    latestWorkoutStartedAt !== undefined
      ? latestWorkoutStartedAt - MONTH_MS * 2
      : undefined;
  const progressionWorkoutResult = useLiveWithFallback(
    getExerciseHistoryWorkoutsSinceQuery(
      db,
      exerciseId,
      oldestProgressionTimestamp
    ),
    [db, exerciseId, oldestProgressionTimestamp]
  );
  const progressionWorkoutRows = progressionWorkoutResult.data;
  const progressionWorkoutIds = useMemo(
    () =>
      Array.from(new Set(progressionWorkoutRows.map(row => row.workout.id))),
    [progressionWorkoutRows]
  );
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
        visibleWorkoutRows,
        setResult.data.filter(row => visibleWorkoutIds.includes(row.workoutId))
      )
        .map(historyEntry => ({
          ...historyEntry,
          sets: getCompletedSets(historyEntry.sets)
        }))
        .filter(historyEntry => historyEntry.sets.length > 0)
        .slice(0, MAX_HISTORY_ITEM_LIMIT),
    [setResult.data, visibleWorkoutIds, visibleWorkoutRows]
  );
  const monthlyProgression = useMemo(() => {
    const latestStartedAt = progressionWorkoutRows[0]?.workout.startedAt;

    if (!latestStartedAt) {
      return null;
    }

    const currentWindowStart = latestStartedAt - MONTH_MS;
    const previousWindowStart = latestStartedAt - MONTH_MS * 2;
    const setsByWorkoutId = new Map<string, Set[]>();

    for (const row of setResult.data) {
      const existingSets = setsByWorkoutId.get(row.workoutId);

      if (existingSets) {
        existingSets.push(row.set);
        continue;
      }

      setsByWorkoutId.set(row.workoutId, [row.set]);
    }

    const currentSets = progressionWorkoutRows.flatMap(row =>
      row.workout.startedAt >= currentWindowStart
        ? (setsByWorkoutId.get(row.workout.id) ?? [])
        : []
    );
    const previousSets = progressionWorkoutRows.flatMap(row =>
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
  }, [progressionWorkoutRows, setResult.data, trackingType]);

  return {
    history,
    latestPersonalRecord: prResult.data[0],
    monthlyProgression,
    prSetIds,
    trackingType
  };
}

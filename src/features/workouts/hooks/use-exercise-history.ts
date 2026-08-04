import { useDrizzle } from '@/src/components/database-provider';
import type { Exercise, Set } from '@/src/db/schema';
import { getExerciseByIdQuery } from '@/src/features/exercises/exercise.repository';
import {
  buildExerciseHistory,
  getExerciseHistoryQuery,
  getPersonalRecordsByExerciseQuery,
  mapExerciseHistoryRows
} from '@/src/features/progress/progress.repository';
import {
  getSetScore,
  resolveTrackingType,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import {
  canLoadExerciseHistoryPage,
  didExerciseHistoryPageFinish,
  getNextExerciseHistoryLimit
} from '@/src/features/workouts/exercise-history-pagination.utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const HISTORY_PAGE_SIZE = 20;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function getBestScore(sets: Set[], trackingType: TrackingType) {
  return sets.reduce((best, set) => {
    const score = getSetScore(trackingType, set);

    return Math.max(best, score ?? 0);
  }, 0);
}

export function useExerciseHistory(exerciseId: Exercise['id']) {
  const db = useDrizzle();
  const [visibleWorkoutLimit, setVisibleWorkoutLimit] =
    useState(HISTORY_PAGE_SIZE);
  const [paginationRetryKey, setPaginationRetryKey] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<Error>();
  const loadMoreRequestRef = useRef<
    | {
        historyUpdatedAt: Date | undefined;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    setVisibleWorkoutLimit(HISTORY_PAGE_SIZE);
    setPaginationRetryKey(0);
    setIsLoadingMore(false);
    setLoadMoreError(undefined);
    loadMoreRequestRef.current = undefined;
  }, [exerciseId]);

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
  const historyResult = useLiveWithFallback(
    getExerciseHistoryQuery(db, exerciseId, visibleWorkoutLimit, {
      includeLimitProbe: true,
      includeProgression: true
    }),
    [db, exerciseId, paginationRetryKey, visibleWorkoutLimit]
  );
  const historyRows = useMemo(
    () => mapExerciseHistoryRows(historyResult.data),
    [historyResult.data]
  );
  const hasMoreHistory =
    historyRows.visibleWorkoutRows.length > visibleWorkoutLimit;
  const visibleWorkoutRows = useMemo(
    () => historyRows.visibleWorkoutRows.slice(0, visibleWorkoutLimit),
    [historyRows.visibleWorkoutRows, visibleWorkoutLimit]
  );

  const visibleWorkoutIds = useMemo(
    () => Array.from(new Set(visibleWorkoutRows.map(row => row.workout.id))),
    [visibleWorkoutRows]
  );
  const progressionWorkoutRows = historyRows.progressionWorkoutRows;
  const setRows = historyRows.setRows;

  useEffect(() => {
    const activeRequest = loadMoreRequestRef.current;

    if (!activeRequest) {
      return;
    }

    const paginationError = historyResult.error;

    if (paginationError) {
      setLoadMoreError(paginationError);
      setIsLoadingMore(false);
      loadMoreRequestRef.current = undefined;

      return;
    }

    if (
      didExerciseHistoryPageFinish(
        activeRequest.historyUpdatedAt,
        historyResult.updatedAt
      )
    ) {
      setLoadMoreError(undefined);
      setIsLoadingMore(false);
      loadMoreRequestRef.current = undefined;
    }
  }, [historyResult.error, historyResult.updatedAt]);

  const loadMore = useCallback(() => {
    if (
      !canLoadExerciseHistoryPage({
        hasMoreHistory,
        isLoadingMore,
        hasActiveRequest: Boolean(loadMoreRequestRef.current),
        hasLoadMoreError: Boolean(loadMoreError)
      })
    ) {
      return;
    }

    loadMoreRequestRef.current = {
      historyUpdatedAt: historyResult.updatedAt
    };
    setIsLoadingMore(true);
    setVisibleWorkoutLimit(limit =>
      getNextExerciseHistoryLimit(limit, HISTORY_PAGE_SIZE)
    );
  }, [hasMoreHistory, isLoadingMore, loadMoreError, historyResult.updatedAt]);

  const retryLoadMore = useCallback(() => {
    if (isLoadingMore || loadMoreRequestRef.current || !loadMoreError) {
      return;
    }

    loadMoreRequestRef.current = {
      historyUpdatedAt: historyResult.updatedAt
    };
    setLoadMoreError(undefined);
    setIsLoadingMore(true);
    setPaginationRetryKey(key => key + 1);
  }, [isLoadingMore, loadMoreError, historyResult.updatedAt]);

  const history = useMemo(
    () =>
      buildExerciseHistory(
        visibleWorkoutRows,
        setRows.filter(row => visibleWorkoutIds.includes(row.workoutId))
      ).slice(0, visibleWorkoutLimit),
    [setRows, visibleWorkoutIds, visibleWorkoutLimit, visibleWorkoutRows]
  );
  const monthlyProgression = useMemo(() => {
    const latestStartedAt = progressionWorkoutRows[0]?.workout.startedAt;

    if (!latestStartedAt) {
      return null;
    }

    const currentWindowStart = latestStartedAt - MONTH_MS;
    const previousWindowStart = latestStartedAt - MONTH_MS * 2;
    const setsByWorkoutId = new Map<string, Set[]>();

    for (const row of setRows) {
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
    const currentBestScore = getBestScore(currentSets, trackingType);
    const previousBestScore = getBestScore(previousSets, trackingType);

    if (currentBestScore === 0 || previousBestScore === 0) {
      return null;
    }

    return {
      delta: currentBestScore - previousBestScore
    };
  }, [progressionWorkoutRows, setRows, trackingType]);

  return {
    history,
    latestPersonalRecord: prResult.data[0],
    monthlyProgression,
    prSetIds,
    trackingType,
    hasMoreHistory,
    isLoadingMore,
    loadMore,
    loadMoreError,
    retryLoadMore
  };
}

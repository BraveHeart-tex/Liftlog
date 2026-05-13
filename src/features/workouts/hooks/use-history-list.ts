import { useDrizzle } from '@/src/components/database-provider';
import {
  getCompletedSetCountsForWorkouts,
  getCompletedSetCountsForWorkoutsQuery,
  getCompletedWorkoutDateRows,
  getCompletedWorkoutDateRowsQuery,
  getCompletedWorkoutsForDateRange,
  getCompletedWorkoutsForDateRangeQuery
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { toLocalDateKey } from '@/src/lib/utils/date';
import { useMemo } from 'react';

function getDateRange(dateKey: string): { endAt: number; startAt: number } {
  const [year, month, day] = dateKey.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  const endDate = new Date(year, month - 1, day + 1);

  return {
    startAt: startDate.getTime(),
    endAt: endDate.getTime()
  };
}

export function useHistoryList(selectedDateKey: string) {
  const db = useDrizzle();

  const workoutDateResult = useLiveWithFallback(
    () => getCompletedWorkoutDateRowsQuery(db),
    () => getCompletedWorkoutDateRows(db),
    [db]
  );

  const workoutCountByDateKey = useMemo(() => {
    const nextWorkoutCountByDateKey = new Map<string, number>();

    for (const workout of workoutDateResult.data) {
      const dateKey = toLocalDateKey(workout.startedAt);

      nextWorkoutCountByDateKey.set(
        dateKey,
        (nextWorkoutCountByDateKey.get(dateKey) ?? 0) + 1
      );
    }

    return nextWorkoutCountByDateKey;
  }, [workoutDateResult.data]);

  const { endAt, startAt } = useMemo(
    () => getDateRange(selectedDateKey),
    [selectedDateKey]
  );

  const workoutResult = useLiveWithFallback(
    () => getCompletedWorkoutsForDateRangeQuery(db, startAt, endAt),
    () => getCompletedWorkoutsForDateRange(db, startAt, endAt),
    [db, startAt, endAt]
  );
  const workoutRows = workoutResult.data;

  const workoutIds = useMemo(
    () => workoutRows.map(workout => workout.id),
    [workoutRows]
  );
  const workoutIdKey = useMemo(() => workoutIds.join(','), [workoutIds]);
  const setCountResult = useLiveWithFallback(
    () => getCompletedSetCountsForWorkoutsQuery(db, workoutIds),
    () => getCompletedSetCountsForWorkouts(db, workoutIds),
    [db, workoutIdKey]
  );

  const setCountByWorkoutId = useMemo(() => {
    const nextSetCountByWorkoutId = new Map<string, number>();

    for (const row of setCountResult.data) {
      nextSetCountByWorkoutId.set(row.workoutId, row.setCount);
    }

    return nextSetCountByWorkoutId;
  }, [setCountResult.data]);

  return {
    workoutRows,
    workoutCountByDateKey,
    setCountByWorkoutId,
    isLoading: !workoutResult.isLive
  };
}

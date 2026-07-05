import { useDrizzle } from '@/src/components/database-provider';
import {
  getCompletedWorkoutLogRowsForDateKeyQuery,
  getCompletedWorkoutCountRowsQuery,
  type WorkoutCalendarDateRange
} from '@/src/features/workout-log/workout-log.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';
import { useMemo } from 'react';

function getWorkoutCalendarDateRange(
  pastMonthRange: number
): WorkoutCalendarDateRange {
  const now = new Date();
  const nowTime = now.getTime();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - pastMonthRange,
    1
  );
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  return {
    startAt: startDate.getTime(),
    startDateKey: toLocalDateKey(startDate.getTime()),
    endAt: endDate.getTime(),
    endDateKey: toLocalDateKey(nowTime)
  };
}

export function useWorkoutCalendarMarks(pastMonthRange: number) {
  const db = useDrizzle();
  const dateRange = useMemo(
    () => getWorkoutCalendarDateRange(pastMonthRange),
    [pastMonthRange]
  );

  const workoutCountResult = useLiveWithFallback(
    getCompletedWorkoutCountRowsQuery(db, dateRange),
    [db, dateRange],
    { deferInitialRead: true, waitForInteractions: true }
  );

  const workoutCountByDateKey = useMemo(
    () =>
      new Map(
        workoutCountResult.data.map(row => [row.dateKey, row.workoutCount])
      ),
    [workoutCountResult.data]
  );

  return {
    workoutCountByDateKey,
    isLive: workoutCountResult.isLive,
    error: workoutCountResult.error
  };
}

export function useWorkoutRowsForDate(selectedDateKey: string) {
  const db = useDrizzle();

  const workoutResult = useLiveWithFallback(
    getCompletedWorkoutLogRowsForDateKeyQuery(db, selectedDateKey),
    [db, selectedDateKey],
    { deferInitialRead: true, waitForInteractions: true }
  );

  return {
    workoutRows: workoutResult.data,
    isLive: workoutResult.isLive,
    error: workoutResult.error
  };
}

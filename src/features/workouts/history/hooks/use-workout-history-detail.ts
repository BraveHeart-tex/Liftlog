import { useDrizzle } from '@/src/providers/database-provider';
import {
  getWorkoutHistoryDetailRowsQuery,
  mapWorkoutHistoryDetailRows
} from '@/src/features/workouts/history/history.repository';
import { getActiveWorkoutQuery } from '@/src/features/workouts/active/active.repository';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { getWorkoutTemplateBySourceWorkoutIdQuery } from '@/src/features/workouts/templates/workout-template.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo } from 'react';

export function useWorkoutHistoryDetail(workoutId: string | undefined) {
  const db = useDrizzle();
  const { weightUnit } = useSettings();
  const resolvedWorkoutId = workoutId ?? '';

  const contentResult = useLiveWithFallback(
    getWorkoutHistoryDetailRowsQuery(db, resolvedWorkoutId),
    [db, resolvedWorkoutId],
    {
      deferInitialRead: true,
      waitForInteractions: true,
      operation: 'workout.getHistoryDetail'
    }
  );
  const {
    workout,
    workoutExerciseRows,
    exerciseById,
    setsByWorkoutExerciseId,
    totalVolume,
    totalCompletedSets
  } = useMemo(
    () => mapWorkoutHistoryDetailRows(contentResult.data),
    [contentResult.data]
  );

  const activeWorkoutResult = useLiveWithFallback(
    getActiveWorkoutQuery(db),
    [db],
    {
      deferInitialRead: true,
      waitForInteractions: true,
      operation: 'workout.getActiveWorkout'
    }
  );
  const activeWorkout = activeWorkoutResult.data[0];

  const savedTemplateResult = useLiveWithFallback(
    getWorkoutTemplateBySourceWorkoutIdQuery(db, resolvedWorkoutId),
    [db, resolvedWorkoutId],
    {
      deferInitialRead: true,
      waitForInteractions: true,
      operation: 'workoutTemplate.getBySourceWorkoutId'
    }
  );
  const hasSavedTemplate = savedTemplateResult.data.length > 0;
  const canRepeatWorkout = Boolean(
    workout && (activeWorkout || contentResult.isLive)
  );

  return {
    workout,
    activeWorkout,
    workoutExerciseRows,
    exerciseById,
    setsByWorkoutExerciseId,
    totalVolume,
    totalCompletedSets,
    weightUnit,
    isLoading:
      Boolean(workoutId) &&
      [contentResult, activeWorkoutResult, savedTemplateResult].some(
        result => !result.isLive && !result.error
      ),
    canRepeatWorkout,
    hasSavedTemplate
  };
}

import { useDrizzle } from '@/src/components/database-provider';
import {
  getActiveWorkoutQuery,
  getWorkoutHistoryDetailRowsQuery,
  mapWorkoutHistoryDetailRows
} from '@/src/features/workouts/workout.repository';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { getWorkoutTemplateBySourceWorkoutIdQuery } from '@/src/features/workouts/workout-template.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo } from 'react';

export function useWorkoutHistoryDetail(workoutId: string | undefined) {
  const db = useDrizzle();
  const { weightUnit } = useSettings();
  const resolvedWorkoutId = workoutId ?? '';

  const contentResult = useLiveWithFallback(
    getWorkoutHistoryDetailRowsQuery(db, resolvedWorkoutId),
    [db, resolvedWorkoutId]
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

  const activeWorkoutResult = useLiveWithFallback(getActiveWorkoutQuery(db), [
    db
  ]);
  const activeWorkout = activeWorkoutResult.data[0];

  const savedTemplateResult = useLiveWithFallback(
    getWorkoutTemplateBySourceWorkoutIdQuery(db, resolvedWorkoutId),
    [db, resolvedWorkoutId]
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
    isLoading: Boolean(workoutId) && !contentResult.isLive,
    canRepeatWorkout,
    hasSavedTemplate
  };
}

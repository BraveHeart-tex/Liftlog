import { useDrizzle } from '@/src/providers/database-provider';
import {
  getExercisesQuery,
  type ExerciseListItem
} from '@/src/features/exercises/exercise.repository';
import { getRecentExerciseIdsQuery } from '@/src/features/workouts/exercise-selection/exercise-selection.repository';
import { RECENT_EXERCISES_LIMIT } from '@/src/features/workouts/shared/workout.constants';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo } from 'react';

interface UseActiveWorkoutExercisePickerParams {
  enabled: boolean;
  exerciseRows?: ExerciseListItem[];
  selectedExerciseIds: ExerciseListItem['id'][];
}

export function useActiveWorkoutExercisePicker({
  enabled,
  exerciseRows,
  selectedExerciseIds
}: UseActiveWorkoutExercisePickerParams) {
  const db = useDrizzle();
  const hasPreloadedExerciseRows = exerciseRows !== undefined;
  const shouldLoadExercises = enabled && !hasPreloadedExerciseRows;
  const selectedExerciseIdsKey = selectedExerciseIds.join('|');
  const exerciseResult = useLiveWithFallback(
    getExercisesQuery(db),
    [db, shouldLoadExercises],
    {
      enabled: shouldLoadExercises,
      fallbackData: [],
      deferInitialRead: true,
      operation: 'exercise.getExercises'
    }
  );
  const recentExerciseRowResult = useLiveWithFallback(
    getRecentExerciseIdsQuery(db, selectedExerciseIds, RECENT_EXERCISES_LIMIT),
    [db, selectedExerciseIdsKey, enabled],
    {
      enabled,
      fallbackData: [],
      deferInitialRead: true,
      operation: 'workout.getRecentExerciseIds'
    }
  );
  const recentExerciseIds = useMemo(
    () => recentExerciseRowResult.data.map(row => row.exerciseId),
    [recentExerciseRowResult.data]
  );

  return {
    exerciseRows: exerciseRows ?? exerciseResult.data,
    recentExerciseIds,
    isLoading:
      enabled &&
      ((!hasPreloadedExerciseRows &&
        !exerciseResult.isLive &&
        !exerciseResult.error) ||
        (!recentExerciseRowResult.isLive && !recentExerciseRowResult.error))
  };
}

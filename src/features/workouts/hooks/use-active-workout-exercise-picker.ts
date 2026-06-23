import { useDrizzle } from '@/src/components/database-provider';
import {
  getExercisesQuery,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import { getRecentExerciseIdsQuery } from '@/src/features/workouts/repository';
import { RECENT_EXERCISES_LIMIT } from '@/src/features/workouts/workout.constants';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
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
      deferInitialRead: true
    }
  );
  const recentExerciseRowResult = useLiveWithFallback(
    getRecentExerciseIdsQuery(db, selectedExerciseIds, RECENT_EXERCISES_LIMIT),
    [db, selectedExerciseIdsKey, enabled],
    {
      enabled,
      fallbackData: [],
      deferInitialRead: true
    }
  );
  const recentExerciseIds = useMemo(() => {
    const seenExerciseIds = new Set<ExerciseListItem['id']>();
    const exerciseIds: ExerciseListItem['id'][] = [];

    for (const row of recentExerciseRowResult.data) {
      if (seenExerciseIds.has(row.exerciseId)) {
        continue;
      }

      seenExerciseIds.add(row.exerciseId);
      exerciseIds.push(row.exerciseId);
    }

    return exerciseIds;
  }, [recentExerciseRowResult.data]);

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

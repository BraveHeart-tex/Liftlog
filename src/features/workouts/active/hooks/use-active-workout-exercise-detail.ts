import { useDrizzle } from '@/src/providers/database-provider';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/shared/workout-components.types';
import {
  getActiveWorkoutExerciseDetailQuery,
  getSetsByWorkoutExerciseIdQuery
} from '@/src/features/workouts/active/active.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo } from 'react';

export function useActiveWorkoutExerciseDetail(
  workoutExerciseId: string | undefined
) {
  const db = useDrizzle();
  const resolvedWorkoutExerciseId = workoutExerciseId ?? '';
  const detailResult = useLiveWithFallback(
    getActiveWorkoutExerciseDetailQuery(db, resolvedWorkoutExerciseId),
    [db, resolvedWorkoutExerciseId],
    { operation: 'workout.getActiveWorkoutExerciseDetail' }
  );
  const setResult = useLiveWithFallback(
    getSetsByWorkoutExerciseIdQuery(db, resolvedWorkoutExerciseId),
    [db, resolvedWorkoutExerciseId],
    { operation: 'workout.getSetsByWorkoutExercise' }
  );
  const detail = detailResult.data[0];
  const workoutExercise = detail?.workoutExercise;
  const pairedWorkoutExercise =
    detailResult.data.length === 1
      ? (detail?.pairedWorkoutExercise ?? null)
      : null;
  const pairedExercise =
    detailResult.data.length === 1 ? (detail?.pairedExercise ?? null) : null;
  const item = useMemo<WorkoutExerciseWithSets | undefined>(() => {
    if (!workoutExercise) {
      return undefined;
    }

    return {
      workoutExercise,
      exercise: detail.exercise,
      sets: setResult.data
    };
  }, [detail?.exercise, setResult.data, workoutExercise]);

  return {
    item,
    pairedWorkoutExercise,
    pairedExercise,
    workout: detail?.workout,
    isLoading:
      Boolean(workoutExerciseId) && (!detailResult.isLive || !setResult.isLive)
  };
}

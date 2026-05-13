import { useDrizzle } from '@/src/components/database-provider';
import { getExerciseByIdQuery } from '@/src/features/exercises/repository';
import {
  getSetsByWorkoutExerciseIdQuery,
  getWorkoutExerciseByIdQuery
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';
import type { WorkoutExerciseWithSets } from '../components/types';

export function useActiveWorkoutExerciseDetail(
  workoutExerciseId: string | undefined
) {
  const db = useDrizzle();
  const resolvedWorkoutExerciseId = workoutExerciseId ?? '';
  const workoutExerciseResult = useLiveWithFallback(
    getWorkoutExerciseByIdQuery(db, resolvedWorkoutExerciseId),
    [db, resolvedWorkoutExerciseId]
  );
  const workoutExercise = workoutExerciseResult.data[0];
  const exerciseId = workoutExercise?.exerciseId ?? null;
  const setResult = useLiveWithFallback(
    getSetsByWorkoutExerciseIdQuery(db, resolvedWorkoutExerciseId),
    [db, resolvedWorkoutExerciseId]
  );
  const exerciseResult = useLiveWithFallback(
    getExerciseByIdQuery(db, exerciseId ?? ''),
    [db, exerciseId]
  );
  const exercise = exerciseResult.data[0] ?? null;
  const item = useMemo<WorkoutExerciseWithSets | undefined>(() => {
    if (!workoutExercise) {
      return undefined;
    }

    return {
      workoutExercise,
      exercise,
      sets: setResult.data
    };
  }, [exercise, setResult.data, workoutExercise]);

  return {
    item,
    isLoading:
      Boolean(workoutExerciseId) &&
      (!workoutExerciseResult.isLive ||
        !setResult.isLive ||
        Boolean(exerciseId && !exerciseResult.isLive))
  };
}

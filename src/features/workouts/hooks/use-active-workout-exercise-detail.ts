import { useDrizzle } from '@/src/components/database-provider';
import type { Exercise } from '@/src/db/schema';
import {
  getExercises,
  getExercisesQuery
} from '@/src/features/exercises/repository';
import {
  getSetsByWorkoutExerciseId,
  getSetsByWorkoutExerciseIdQuery,
  getWorkoutExerciseById,
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
    () => getWorkoutExerciseByIdQuery(db, resolvedWorkoutExerciseId),
    () => {
      const workoutExercise = getWorkoutExerciseById(
        db,
        resolvedWorkoutExerciseId
      );

      return workoutExercise ? [workoutExercise] : [];
    },
    [db, resolvedWorkoutExerciseId]
  );
  const workoutExercise = workoutExerciseResult.data[0];
  const setResult = useLiveWithFallback(
    () => getSetsByWorkoutExerciseIdQuery(db, resolvedWorkoutExerciseId),
    () => getSetsByWorkoutExerciseId(db, resolvedWorkoutExerciseId),
    [db, resolvedWorkoutExerciseId]
  );
  const exerciseResult = useLiveWithFallback(
    () => getExercisesQuery(db),
    () => getExercises(db),
    [db]
  );

  const exerciseById = useMemo(
    () =>
      new Map<Exercise['id'], Exercise>(
        exerciseResult.data.map(exercise => [exercise.id, exercise])
      ),
    [exerciseResult.data]
  );
  const item = useMemo<WorkoutExerciseWithSets | undefined>(() => {
    if (!workoutExercise) {
      return undefined;
    }

    return {
      workoutExercise,
      exercise: exerciseById.get(workoutExercise.exerciseId),
      sets: setResult.data
    };
  }, [exerciseById, setResult.data, workoutExercise]);

  return {
    item,
    isLoading:
      Boolean(workoutExerciseId) &&
      (!workoutExerciseResult.isLive || !setResult.isLive)
  };
}

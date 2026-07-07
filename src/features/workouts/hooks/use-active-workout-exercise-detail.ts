import { useDrizzle } from '@/src/components/database-provider';
import {
  getExerciseByIdQuery,
  getExercisesByIdsQuery
} from '@/src/features/exercises/exercise.repository';
import {
  getSetsByWorkoutExerciseIdQuery,
  getWorkoutByIdQuery,
  getWorkoutExerciseByIdQuery,
  getWorkoutExercisesQuery
} from '@/src/features/workouts/workout.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo } from 'react';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/workout-components.types';

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
  const workoutId = workoutExercise?.workoutId ?? null;
  const setResult = useLiveWithFallback(
    getSetsByWorkoutExerciseIdQuery(db, resolvedWorkoutExerciseId),
    [db, resolvedWorkoutExerciseId]
  );
  const workoutResult = useLiveWithFallback(
    getWorkoutByIdQuery(db, workoutId ?? ''),
    [db, workoutId]
  );
  const workoutExerciseRowsResult = useLiveWithFallback(
    getWorkoutExercisesQuery(db, workoutId ?? ''),
    [db, workoutId]
  );
  const pairedWorkoutExercise = useMemo(() => {
    if (!workoutExercise?.supersetId) {
      return null;
    }

    const pairedRows = workoutExerciseRowsResult.data.filter(
      row => row.supersetId === workoutExercise.supersetId
    );

    if (pairedRows.length !== 2) {
      return null;
    }

    return pairedRows.find(row => row.id !== workoutExercise.id) ?? null;
  }, [workoutExercise, workoutExerciseRowsResult.data]);
  const pairedExerciseResult = useLiveWithFallback(
    getExercisesByIdsQuery(
      db,
      pairedWorkoutExercise ? [pairedWorkoutExercise.exerciseId] : []
    ),
    [db, pairedWorkoutExercise?.exerciseId]
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
    pairedWorkoutExercise,
    pairedExercise: pairedExerciseResult.data[0] ?? null,
    workout: workoutResult.data[0],
    isLoading:
      Boolean(workoutExerciseId) &&
      (!workoutExerciseResult.isLive ||
        !setResult.isLive ||
        Boolean(workoutId && !workoutResult.isLive) ||
        Boolean(workoutId && !workoutExerciseRowsResult.isLive) ||
        Boolean(pairedWorkoutExercise && !pairedExerciseResult.isLive) ||
        Boolean(exerciseId && !exerciseResult.isLive))
  };
}

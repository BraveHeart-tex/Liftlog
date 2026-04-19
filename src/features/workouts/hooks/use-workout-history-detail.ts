import { useDrizzle } from '@/src/components/database-provider';
import type { Set, WorkoutExercise } from '@/src/db/schema';
import {
  getExercisesByIds,
  getExercisesByIdsQuery,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import { useSettings } from '@/src/features/settings/hooks';
import {
  getActiveWorkout,
  getActiveWorkoutQuery,
  getSetsForWorkoutExercises,
  getSetsForWorkoutExercisesQuery,
  getWorkoutById,
  getWorkoutByIdQuery,
  getWorkoutExercises,
  getWorkoutExercisesQuery
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';

export function useWorkoutHistoryDetail(workoutId: string | undefined) {
  const db = useDrizzle();
  const { weightUnit } = useSettings();
  const resolvedWorkoutId = workoutId ?? '';

  const workoutResult = useLiveWithFallback(
    () => getWorkoutByIdQuery(db, resolvedWorkoutId),
    () => {
      const workout = getWorkoutById(db, resolvedWorkoutId);

      return workout ? [workout] : [];
    },
    [db, resolvedWorkoutId]
  );
  const workout = workoutResult.data[0];

  const activeWorkoutResult = useLiveWithFallback(
    () => getActiveWorkoutQuery(db),
    () => {
      const activeWorkout = getActiveWorkout(db);

      return activeWorkout ? [activeWorkout] : [];
    },
    [db]
  );
  const activeWorkout = activeWorkoutResult.data[0];

  const workoutExerciseResult = useLiveWithFallback(
    () => getWorkoutExercisesQuery(db, resolvedWorkoutId),
    () => getWorkoutExercises(db, resolvedWorkoutId),
    [db, resolvedWorkoutId]
  );
  const workoutExerciseRows = workoutExerciseResult.data;

  const workoutExerciseIds = useMemo(
    () => workoutExerciseRows.map(workoutExercise => workoutExercise.id),
    [workoutExerciseRows]
  );
  const workoutExerciseIdKey = useMemo(
    () => workoutExerciseIds.join(','),
    [workoutExerciseIds]
  );
  const setResult = useLiveWithFallback(
    () => getSetsForWorkoutExercisesQuery(db, workoutExerciseIds),
    () => getSetsForWorkoutExercises(db, workoutExerciseIds),
    [db, workoutExerciseIdKey]
  );
  const setRows = setResult.data;

  const exerciseIds = useMemo(
    () =>
      workoutExerciseRows.map(workoutExercise => workoutExercise.exerciseId),
    [workoutExerciseRows]
  );
  const exerciseIdKey = useMemo(() => exerciseIds.join(','), [exerciseIds]);
  const exerciseResult = useLiveWithFallback(
    () => getExercisesByIdsQuery(db, exerciseIds),
    () => getExercisesByIds(db, exerciseIds),
    [db, exerciseIdKey]
  );

  const exerciseById = useMemo(
    () =>
      new Map<ExerciseListItem['id'], ExerciseListItem>(
        exerciseResult.data.map(exercise => [exercise.id, exercise])
      ),
    [exerciseResult.data]
  );

  const setsByWorkoutExerciseId = useMemo(() => {
    const nextSetsByWorkoutExerciseId = new Map<WorkoutExercise['id'], Set[]>();

    for (const set of setRows) {
      if (set.status !== 'completed') {
        continue;
      }

      const existingSets =
        nextSetsByWorkoutExerciseId.get(set.workoutExerciseId) ?? [];

      nextSetsByWorkoutExerciseId.set(set.workoutExerciseId, [
        ...existingSets,
        set
      ]);
    }

    return nextSetsByWorkoutExerciseId;
  }, [setRows]);

  const totalVolume = useMemo(() => {
    const volume = setRows.reduce((total, set) => {
      if (set.status !== 'completed') {
        return total;
      }

      return total + set.weightKg * set.reps;
    }, 0);

    return Math.round(volume * 10) / 10;
  }, [setRows]);

  const totalCompletedSets = useMemo(
    () => setRows.filter(set => set.status === 'completed').length,
    [setRows]
  );
  const canRepeatWorkout = Boolean(
    workout && (activeWorkout || workoutExerciseResult.isLive)
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
    isLoading: Boolean(workoutId) && !workoutResult.isLive,
    canRepeatWorkout
  };
}

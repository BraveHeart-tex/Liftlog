import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import {
  getSetsForWorkoutQuery,
  getWorkoutExercisesQuery,
  getWorkoutExercisesWithExercisesQuery
} from '@/src/features/workouts/workout.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo, useState } from 'react';

interface UseActiveWorkoutContentParams {
  activeWorkout: Workout;
  exerciseRows?: ExerciseListItem[];
}

export function useActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: UseActiveWorkoutContentParams) {
  const db = useDrizzle();
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const hasPreloadedExerciseRows = exerciseRows !== undefined;
  const workoutExerciseResult = useLiveWithFallback(
    getWorkoutExercisesQuery(db, activeWorkout.id),
    [db, activeWorkout.id, hasPreloadedExerciseRows],
    {
      deferInitialRead: true,
      enabled: hasPreloadedExerciseRows,
      operation: 'workout.getWorkoutExercises'
    }
  );
  const joinedWorkoutExerciseResult = useLiveWithFallback(
    getWorkoutExercisesWithExercisesQuery(db, activeWorkout.id),
    [db, activeWorkout.id, hasPreloadedExerciseRows],
    {
      deferInitialRead: true,
      enabled: !hasPreloadedExerciseRows,
      fallbackData: [],
      operation: 'workout.getWorkoutExercisesWithExercises'
    }
  );
  const setResult = useLiveWithFallback(
    getSetsForWorkoutQuery(db, activeWorkout.id),
    [db, activeWorkout.id],
    {
      deferInitialRead: true,
      operation: 'workout.getSetsForWorkout'
    }
  );
  const workoutExerciseRows = useMemo(
    () =>
      hasPreloadedExerciseRows
        ? workoutExerciseResult.data
        : joinedWorkoutExerciseResult.data.map(row => row.workoutExercise),
    [
      hasPreloadedExerciseRows,
      joinedWorkoutExerciseResult.data,
      workoutExerciseResult.data
    ]
  );
  const joinedExerciseRows = useMemo(
    () => joinedWorkoutExerciseResult.data.map(row => row.exercise),
    [joinedWorkoutExerciseResult.data]
  );
  const visibleExerciseRows = exerciseRows ?? joinedExerciseRows;

  const exerciseById = useMemo(
    () =>
      new Map<ExerciseListItem['id'], ExerciseListItem>(
        visibleExerciseRows.map(exercise => [exercise.id, exercise])
      ),
    [visibleExerciseRows]
  );
  const setRows = useMemo(
    () => setResult.data.map(row => row.set),
    [setResult.data]
  );
  const completedSetCount = useMemo(
    () => setRows.filter(set => set.status === 'completed').length,
    [setRows]
  );
  const activeWorkoutExerciseResult = hasPreloadedExerciseRows
    ? workoutExerciseResult
    : joinedWorkoutExerciseResult;
  const workoutExerciseLoadError =
    activeWorkoutExerciseResult.error ?? setResult.error;

  return {
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    workoutExerciseRows,
    setRows,
    completedSetCount,
    isLoadingWorkoutExercises:
      (activeWorkoutExerciseResult.isLoading || setResult.isLoading) &&
      !workoutExerciseLoadError,
    workoutExerciseLoadError,
    exerciseById
  };
}

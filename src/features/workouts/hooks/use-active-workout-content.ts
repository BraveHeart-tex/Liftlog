import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import {
  getExercisesByIdsQuery,
  type ExerciseListItem
} from '@/src/features/exercises/exercise.repository';
import {
  getCompletedSetCountsForWorkoutsQuery,
  getWorkoutExercisesQuery
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
    [db, activeWorkout.id]
  );
  const completedSetCountResult = useLiveWithFallback(
    getCompletedSetCountsForWorkoutsQuery(db, [activeWorkout.id]),
    [db, activeWorkout.id]
  );
  const selectedExerciseIds = useMemo(
    () =>
      workoutExerciseResult.data.map(
        workoutExercise => workoutExercise.exerciseId
      ),
    [workoutExerciseResult.data]
  );
  const selectedExerciseIdsKey = selectedExerciseIds.join('|');
  const selectedExerciseResult = useLiveWithFallback(
    getExercisesByIdsQuery(db, selectedExerciseIds),
    [db, selectedExerciseIdsKey, hasPreloadedExerciseRows],
    {
      enabled: !hasPreloadedExerciseRows && selectedExerciseIds.length > 0,
      fallbackData: []
    }
  );

  const visibleExerciseRows = exerciseRows ?? selectedExerciseResult.data;

  const exerciseById = useMemo(
    () =>
      new Map<ExerciseListItem['id'], ExerciseListItem>(
        visibleExerciseRows.map(exercise => [exercise.id, exercise])
      ),
    [visibleExerciseRows]
  );

  return {
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    workoutExerciseRows: workoutExerciseResult.data,
    completedSetCount: completedSetCountResult.data[0]?.setCount ?? 0,
    isLoadingWorkoutExercises: !workoutExerciseResult.isLive,
    exerciseById
  };
}

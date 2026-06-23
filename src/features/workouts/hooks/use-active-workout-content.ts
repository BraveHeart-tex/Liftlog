import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import {
  getCompletedSetCountsForWorkoutsQuery,
  getRecentExerciseIdsQuery,
  getWorkoutExercisesQuery
} from '@/src/features/workouts/repository';
import { RECENT_EXERCISES_LIMIT } from '@/src/features/workouts/workout.constants';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo, useState } from 'react';

interface UseActiveWorkoutContentParams {
  activeWorkout: Workout;
  exerciseRows: ExerciseListItem[];
}

export function useActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: UseActiveWorkoutContentParams) {
  const db = useDrizzle();
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
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
  const recentExerciseRowResult = useLiveWithFallback(
    getRecentExerciseIdsQuery(db, selectedExerciseIds, RECENT_EXERCISES_LIMIT),
    [db, selectedExerciseIdsKey]
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

  const exerciseById = useMemo(
    () =>
      new Map<ExerciseListItem['id'], ExerciseListItem>(
        exerciseRows.map(exercise => [exercise.id, exercise])
      ),
    [exerciseRows]
  );

  return {
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    workoutExerciseRows: workoutExerciseResult.data,
    completedSetCount: completedSetCountResult.data[0]?.setCount ?? 0,
    recentExerciseIds,
    isLoadingWorkoutExercises: !workoutExerciseResult.isLive,
    exerciseById
  };
}

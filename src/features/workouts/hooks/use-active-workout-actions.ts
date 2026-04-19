import { useDrizzle } from '@/src/components/database-provider';
import type { Exercise, Workout, WorkoutExercise } from '@/src/db/schema';
import {
  completeWorkout,
  createWorkoutExercise
} from '@/src/features/workouts/repository';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback } from 'react';

type UseActiveWorkoutActionsParams = {
  activeWorkout: Workout;
  workoutExerciseRows: WorkoutExercise[];
  isLoadingWorkoutExercises: boolean;
  setIsExercisePickerOpen: (isOpen: boolean) => void;
};

export function useActiveWorkoutActions({
  activeWorkout,
  workoutExerciseRows,
  isLoadingWorkoutExercises,
  setIsExercisePickerOpen
}: UseActiveWorkoutActionsParams) {
  const db = useDrizzle();

  const finishWorkout = useCallback(() => {
    completeWorkout(db, activeWorkout.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)/workout');
  }, [activeWorkout.id, db]);

  const selectExercise = useCallback(
    (exercise: Exercise) => {
      if (isLoadingWorkoutExercises) {
        return;
      }

      createWorkoutExercise(db, {
        workoutId: activeWorkout.id,
        exerciseId: exercise.id,
        order: workoutExerciseRows.length,
        notes: null
      });
      setIsExercisePickerOpen(false);
    },
    [
      activeWorkout.id,
      db,
      isLoadingWorkoutExercises,
      setIsExercisePickerOpen,
      workoutExerciseRows.length
    ]
  );

  return {
    finishWorkout,
    selectExercise
  };
}

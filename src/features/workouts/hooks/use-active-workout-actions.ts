import { useDrizzle } from '@/src/components/database-provider';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import {
  completeWorkout,
  createWorkoutExercise
} from '@/src/features/workouts/repository';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback } from 'react';

interface UseActiveWorkoutActionsParams {
  activeWorkout: Workout;
  workoutExerciseRows: WorkoutExercise[];
  isLoadingWorkoutExercises: boolean;
  setIsExercisePickerOpen: (isOpen: boolean) => void;
}

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
    (exercise: ExerciseListItem) => {
      if (isLoadingWorkoutExercises) {
        return;
      }

      const alreadyAdded = workoutExerciseRows.some(
        workoutExercise => workoutExercise.exerciseId === exercise.id
      );

      if (alreadyAdded) {
        setIsExercisePickerOpen(false);

        return;
      }

      setIsExercisePickerOpen(false);
      createWorkoutExercise(db, {
        workoutId: activeWorkout.id,
        exerciseId: exercise.id,
        order: workoutExerciseRows.length,
        notes: null
      });
    },
    [
      activeWorkout.id,
      db,
      isLoadingWorkoutExercises,
      setIsExercisePickerOpen,
      workoutExerciseRows
    ]
  );

  return {
    finishWorkout,
    selectExercise
  };
}

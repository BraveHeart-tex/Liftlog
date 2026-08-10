import { useDrizzle } from '@/src/components/database-provider';
import type { NewExercise, Workout, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import {
  addExerciseToWorkout,
  createCustomExerciseAndAddToWorkout
} from '@/src/features/workouts/workout.repository';
import { triggerHapticLight } from '@/src/lib/haptics/haptics';
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
      addExerciseToWorkout(db, {
        workoutId: activeWorkout.id,
        exerciseId: exercise.id
      });
      triggerHapticLight('exercise added to workout');
    },
    [
      activeWorkout.id,
      db,
      isLoadingWorkoutExercises,
      setIsExercisePickerOpen,
      workoutExerciseRows
    ]
  );

  const createAndSelectCustomExercise = useCallback(
    (exercise: NewExercise) => {
      if (isLoadingWorkoutExercises) {
        return null;
      }

      const { exercise: createdExercise } = createCustomExerciseAndAddToWorkout(
        db,
        activeWorkout.id,
        exercise
      );

      setIsExercisePickerOpen(false);
      triggerHapticLight('custom exercise added to workout');

      return createdExercise;
    },
    [activeWorkout.id, db, isLoadingWorkoutExercises, setIsExercisePickerOpen]
  );

  return {
    selectExercise,
    createAndSelectCustomExercise
  };
}

import { useDrizzle } from '@/src/providers/database-provider';
import { showSnackbar } from '@/src/components/ui/snackbar';
import type { NewExercise, Workout, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import {
  addExerciseToWorkout,
  createCustomExerciseAndAddToWorkout
} from '@/src/features/workouts/active/active.repository';
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

      try {
        addExerciseToWorkout(db, {
          workoutId: activeWorkout.id,
          exerciseId: exercise.id
        });
        triggerHapticLight('exercise added to workout');
      } catch (error) {
        console.error('Failed to add exercise to workout', error);
        showSnackbar({
          message: 'Could not add exercise. Please try again.',
          variant: 'danger'
        });
      }
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

      try {
        const { exercise: createdExercise } =
          createCustomExerciseAndAddToWorkout(db, activeWorkout.id, exercise);

        setIsExercisePickerOpen(false);
        triggerHapticLight('custom exercise added to workout');

        return createdExercise;
      } catch (error) {
        console.error('Failed to create custom exercise in workout', error);
        showSnackbar({
          message: 'Could not create exercise. Please try again.',
          variant: 'danger'
        });

        return null;
      }
    },
    [activeWorkout.id, db, isLoadingWorkoutExercises, setIsExercisePickerOpen]
  );

  return {
    selectExercise,
    createAndSelectCustomExercise
  };
}

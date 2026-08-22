import { useDrizzle } from '@/src/components/database-provider';
import { showSnackbar } from '@/src/components/ui/snackbar';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import { repeatWorkout } from '@/src/features/workouts/workout.repository';
import { triggerHapticMedium } from '@/src/lib/haptics/haptics';
import { router } from 'expo-router';
import { useCallback } from 'react';

interface UseRepeatWorkoutParams {
  workout: Workout | undefined;
  activeWorkout: Workout | undefined;
  workoutExerciseRows: WorkoutExercise[];
  canRepeatWorkout: boolean;
}

export function useRepeatWorkout({
  workout,
  activeWorkout,
  workoutExerciseRows,
  canRepeatWorkout
}: UseRepeatWorkoutParams) {
  const db = useDrizzle();

  return useCallback(() => {
    if (!workout || !canRepeatWorkout) {
      return;
    }

    if (activeWorkout) {
      router.navigate('/(tabs)/workout/active');

      return;
    }

    try {
      repeatWorkout(db, {
        sourceWorkout: workout,
        sourceWorkoutExercises: workoutExerciseRows
      });
      triggerHapticMedium('workout creation');

      router.navigate('/(tabs)/workout/active');
    } catch (error) {
      console.error('Failed to repeat workout', error);
      showSnackbar({
        message: 'Could not repeat workout. Please try again.',
        variant: 'danger'
      });
    }
  }, [activeWorkout, canRepeatWorkout, db, workout, workoutExerciseRows]);
}

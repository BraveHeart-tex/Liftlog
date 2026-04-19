import { useDrizzle } from '@/src/components/database-provider';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import {
  createWorkout,
  createWorkoutExercise
} from '@/src/features/workouts/repository';
import { router } from 'expo-router';
import { useCallback } from 'react';

type UseRepeatWorkoutParams = {
  workout: Workout | undefined;
  activeWorkout: Workout | undefined;
  workoutExerciseRows: WorkoutExercise[];
  canRepeatWorkout: boolean;
};

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
      router.push('/(tabs)/workout/active');

      return;
    }

    const newWorkout = createWorkout(db, {
      name: workout.name,
      status: 'in_progress',
      startedAt: Date.now()
    });

    for (const workoutExercise of workoutExerciseRows) {
      createWorkoutExercise(db, {
        workoutId: newWorkout.id,
        exerciseId: workoutExercise.exerciseId,
        order: workoutExercise.order,
        notes: null
      });
    }

    router.push('/(tabs)/workout/active');
  }, [activeWorkout, canRepeatWorkout, db, workout, workoutExerciseRows]);
}

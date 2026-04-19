import { useDrizzle } from '@/src/components/database-provider';
import {
  workoutExercises,
  type Workout,
  type WorkoutExercise
} from '@/src/db/schema';
import { createWorkout } from '@/src/features/workouts/repository';
import { generateUuid } from '@/src/lib/utils/uuid';
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

    if (workoutExerciseRows.length > 0) {
      db.insert(workoutExercises)
        .values(
          workoutExerciseRows.map(workoutExercise => ({
            id: generateUuid(),
            workoutId: newWorkout.id,
            exerciseId: workoutExercise.exerciseId,
            order: workoutExercise.order,
            notes: null
          }))
        )
        .run();
    }

    router.push('/(tabs)/workout/active');
  }, [activeWorkout, canRepeatWorkout, db, workout, workoutExerciseRows]);
}

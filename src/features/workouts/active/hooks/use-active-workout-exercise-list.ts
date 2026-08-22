import type { Set, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { useMemo } from 'react';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/shared/workout-components.types';

interface UseActiveWorkoutExerciseListParams {
  workoutExercises: WorkoutExercise[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
  sets: Set[];
}

export function useActiveWorkoutExerciseList({
  workoutExercises,
  exerciseById,
  sets
}: UseActiveWorkoutExerciseListParams) {
  return useMemo<WorkoutExerciseWithSets[]>(() => {
    const setsByWorkoutExerciseId = new Map<WorkoutExercise['id'], Set[]>();

    for (const set of sets) {
      const existingSets = setsByWorkoutExerciseId.get(set.workoutExerciseId);

      if (existingSets) {
        existingSets.push(set);
        continue;
      }

      setsByWorkoutExerciseId.set(set.workoutExerciseId, [set]);
    }

    return workoutExercises.map(workoutExercise => ({
      workoutExercise,
      exercise: exerciseById.get(workoutExercise.exerciseId),
      sets: setsByWorkoutExerciseId.get(workoutExercise.id) ?? []
    }));
  }, [exerciseById, sets, workoutExercises]);
}

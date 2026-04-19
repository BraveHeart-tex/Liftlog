import { useDrizzle } from '@/src/components/database-provider';
import type { Set, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import {
  getSetsForWorkoutExercises,
  getSetsForWorkoutExercisesQuery
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';
import type { WorkoutExerciseWithSets } from '../components/types';

type UseActiveWorkoutExerciseListParams = {
  workoutExercises: WorkoutExercise[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
};

export function useActiveWorkoutExerciseList({
  workoutExercises,
  exerciseById
}: UseActiveWorkoutExerciseListParams) {
  const db = useDrizzle();
  const workoutExerciseIds = useMemo(
    () => workoutExercises.map(workoutExercise => workoutExercise.id),
    [workoutExercises]
  );
  const workoutExerciseIdKey = useMemo(
    () => workoutExerciseIds.join(','),
    [workoutExerciseIds]
  );
  const setResult = useLiveWithFallback(
    () => getSetsForWorkoutExercisesQuery(db, workoutExerciseIds),
    () => getSetsForWorkoutExercises(db, workoutExerciseIds),
    [db, workoutExerciseIdKey]
  );

  return useMemo<WorkoutExerciseWithSets[]>(() => {
    const setsByWorkoutExerciseId = new Map<WorkoutExercise['id'], Set[]>();

    for (const set of setResult.data) {
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
  }, [exerciseById, setResult.data, workoutExercises]);
}

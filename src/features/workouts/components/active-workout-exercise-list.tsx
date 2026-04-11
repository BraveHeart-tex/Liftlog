import { useDrizzle } from '@/src/components/database-provider';
import { type Exercise, type Set, type WorkoutExercise } from '@/src/db/schema';
import { getSetsForWorkoutExercisesQuery } from '@/src/features/workouts/repository';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';
import { ExerciseCard } from './exercise-card';
import type { WorkoutExerciseWithSets } from './types';

type ActiveWorkoutExerciseListProps = {
  workoutExercises: WorkoutExercise[];
  exerciseById: Map<Exercise['id'], Exercise>;
};

export function ActiveWorkoutExerciseList({
  workoutExercises,
  exerciseById
}: ActiveWorkoutExerciseListProps) {
  const db = useDrizzle();
  const workoutExerciseIds = workoutExercises.map(
    workoutExercise => workoutExercise.id
  );
  const workoutExerciseIdKey = workoutExerciseIds.join(',');

  const { data: setRows = [] } = useLiveQuery(
    getSetsForWorkoutExercisesQuery(db, workoutExerciseIds),
    [db, workoutExerciseIdKey]
  );

  const workoutExercisesWithSets = useMemo<WorkoutExerciseWithSets[]>(() => {
    const setsByWorkoutExerciseId = new Map<WorkoutExercise['id'], Set[]>();

    for (const set of setRows) {
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
  }, [exerciseById, setRows, workoutExercises]);

  return (
    <>
      {workoutExercisesWithSets.map(workoutExercise => (
        <ExerciseCard
          key={workoutExercise.workoutExercise.id}
          item={workoutExercise}
          className="mt-4"
        />
      ))}
    </>
  );
}

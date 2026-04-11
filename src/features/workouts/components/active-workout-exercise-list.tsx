import type { DrizzleDb } from '@/src/db/client';
import {
  sets,
  workoutExercises,
  type Exercise,
  type Set,
  type Workout,
  type WorkoutExercise
} from '@/src/db/schema';
import { createLiveQuery } from '@/src/features/workouts/live-query';
import {
  getWorkoutExerciseWithSets,
  getWorkoutWithExercises
} from '@/src/features/workouts/repository';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';
import { ExerciseCard } from './exercise-card';
import type { WorkoutExerciseWithSets } from './types';

type ActiveWorkoutExerciseListProps = {
  db: DrizzleDb;
  workout: Workout;
  exerciseById: Map<Exercise['id'], Exercise>;
};

export function ActiveWorkoutExerciseList({
  db,
  workout,
  exerciseById
}: ActiveWorkoutExerciseListProps) {
  const { data: workoutWithExercises } = useLiveQuery(
    createLiveQuery(workoutExercises, () =>
      getWorkoutWithExercises(db, workout.id)
    ),
    [db, workout.id]
  );

  const workoutExerciseRows = workoutWithExercises?.exercises ?? [];
  const workoutExerciseIds = workoutExerciseRows
    .map(workoutExercise => workoutExercise.id)
    .join(',');

  const { data: workoutExerciseSetRows = [] } = useLiveQuery(
    createLiveQuery(sets, () =>
      workoutExerciseRows
        .map(workoutExercise =>
          getWorkoutExerciseWithSets(db, workoutExercise.id)
        )
        .filter(
          (
            workoutExerciseWithSets
          ): workoutExerciseWithSets is {
            workoutExercise: WorkoutExercise;
            sets: Set[];
          } => Boolean(workoutExerciseWithSets)
        )
    ),
    [db, workoutExerciseIds]
  );

  const workoutExercisesWithSets = useMemo<WorkoutExerciseWithSets[]>(
    () =>
      workoutExerciseSetRows.map(row => ({
        workoutExercise: row.workoutExercise,
        exercise: exerciseById.get(row.workoutExercise.exerciseId),
        sets: row.sets
      })),
    [exerciseById, workoutExerciseSetRows]
  );

  return (
    <>
      {workoutExercisesWithSets.map(workoutExercise => (
        <ExerciseCard
          key={workoutExercise.workoutExercise.id}
          db={db}
          item={workoutExercise}
          className="mt-4"
        />
      ))}
    </>
  );
}

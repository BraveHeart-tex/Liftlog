import type { Set, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';

export type WorkoutExerciseWithSets = {
  workoutExercise: WorkoutExercise;
  exercise: ExerciseListItem | undefined;
  sets: Set[];
};

export type SetValues = {
  weightKg: number;
  reps: number;
};

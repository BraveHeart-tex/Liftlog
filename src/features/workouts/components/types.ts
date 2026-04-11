import type { Exercise, Set, WorkoutExercise } from '@/src/db/schema';

export type WorkoutExerciseWithSets = {
  workoutExercise: WorkoutExercise;
  exercise: Exercise | undefined;
  sets: Set[];
};

export type SetValues = {
  weightKg: number;
  reps: number;
};

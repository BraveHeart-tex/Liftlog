import type { Set, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';

export interface WorkoutExerciseWithSets {
  workoutExercise: WorkoutExercise;
  exercise: ExerciseListItem | undefined;
  sets: Set[];
}

export interface SetValues {
  weightKg: number;
  reps: number;
}

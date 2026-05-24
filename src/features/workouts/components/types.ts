import type { Set, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import type { SetValues } from '@/src/features/progress/tracking';

export interface WorkoutExerciseWithSets {
  workoutExercise: WorkoutExercise;
  exercise: ExerciseListItem | undefined;
  sets: Set[];
}

export type { SetValues };

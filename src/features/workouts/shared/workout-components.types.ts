import type { Set, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import type { SetValues } from '@/src/features/progress/tracking.domain';

export interface WorkoutExerciseWithSets {
  workoutExercise: WorkoutExercise;
  exercise: ExerciseListItem | undefined;
  sets: Set[];
}

export type { SetValues };

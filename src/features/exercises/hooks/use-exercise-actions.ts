import { useDrizzle } from '@/src/components/database-provider';
import type { Exercise, NewExercise } from '@/src/db/schema';
import {
  createExercise,
  removeCustomExercise,
  updateCustomExerciseName
} from '@/src/features/exercises/repository';

export function useExerciseActions() {
  const db = useDrizzle();

  const renameCustomExercise = (id: Exercise['id'], name: Exercise['name']) => {
    return updateCustomExerciseName(db, id, name);
  };

  const removeCustomExerciseById = (id: Exercise['id']) => {
    return removeCustomExercise(db, id);
  };

  const createCustomExercise = (exercise: NewExercise) => {
    return createExercise(db, exercise);
  };

  return {
    createCustomExercise,
    renameCustomExercise,
    removeCustomExerciseById
  };
}

import { useDrizzle } from '@/src/components/database-provider';
import type { Exercise, NewExercise } from '@/src/db/schema';
import {
  createExercise,
  hasExerciseNameConflict,
  removeCustomExercise,
  updateCustomExerciseDetails,
  updateCustomExerciseName
} from '@/src/features/exercises/repository';

export function useExerciseActions() {
  const db = useDrizzle();

  const renameCustomExercise = (id: Exercise['id'], name: Exercise['name']) => {
    return updateCustomExerciseName(db, id, name);
  };

  const hasCustomExerciseNameConflict = (
    id: Exercise['id'],
    name: Exercise['name']
  ) => {
    return hasExerciseNameConflict(db, id, name);
  };

  const removeCustomExerciseById = (id: Exercise['id']) => {
    return removeCustomExercise(db, id);
  };

  const createCustomExercise = (exercise: NewExercise) => {
    return createExercise(db, exercise);
  };

  const updateExerciseDetails = (
    id: Exercise['id'],
    details: Parameters<typeof updateCustomExerciseDetails>[2]
  ) => {
    return updateCustomExerciseDetails(db, id, details);
  };

  return {
    createCustomExercise,
    hasCustomExerciseNameConflict,
    renameCustomExercise,
    removeCustomExerciseById,
    updateCustomExerciseDetails: updateExerciseDetails
  };
}

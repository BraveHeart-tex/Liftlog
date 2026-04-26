import type { NewExercise } from '@/src/db/schema';
import type { ExerciseCategory } from '@/src/features/exercises/constants';
import { useExercises } from '@/src/features/exercises/hooks/use-exercises';
import { useCallback, useState } from 'react';

interface UseCustomExerciseFormResult {
  name: string;
  category: ExerciseCategory;
  selectedPrimaryMuscles: string[];
  selectedSecondaryMuscles: string[];
  nameError?: string;
  primaryMusclesError?: string;
  setName: (name: string) => void;
  setCategory: (category: ExerciseCategory) => void;
  togglePrimaryMuscle: (muscle: string) => void;
  toggleSecondaryMuscle: (muscle: string) => void;
  submit: () => NewExercise | null;
  reset: () => void;
}

const DEFAULT_CATEGORY: ExerciseCategory = 'barbell';

export function useCustomExerciseForm(): UseCustomExerciseFormResult {
  const exercises = useExercises();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>(DEFAULT_CATEGORY);
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<
    string[]
  >([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState<
    string[]
  >([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();
  const hasDuplicateName = exercises.some(
    exercise => exercise.name.trim().toLowerCase() === normalizedName
  );

  const nameError =
    attemptedSubmit && trimmedName.length === 0
      ? 'Name is required'
      : attemptedSubmit && hasDuplicateName
        ? 'An exercise with this name already exists'
        : undefined;
  const primaryMusclesError =
    attemptedSubmit && selectedPrimaryMuscles.length === 0
      ? 'Select at least one primary muscle'
      : undefined;

  const togglePrimaryMuscle = useCallback((muscle: string) => {
    setSelectedPrimaryMuscles(current => {
      if (current.includes(muscle)) {
        return current.filter(selectedMuscle => selectedMuscle !== muscle);
      }

      setSelectedSecondaryMuscles(existing =>
        existing.filter(selectedMuscle => selectedMuscle !== muscle)
      );

      return [...current, muscle];
    });
  }, []);

  const toggleSecondaryMuscle = useCallback((muscle: string) => {
    setSelectedSecondaryMuscles(current => {
      if (current.includes(muscle)) {
        return current.filter(selectedMuscle => selectedMuscle !== muscle);
      }

      setSelectedPrimaryMuscles(existing =>
        existing.filter(selectedMuscle => selectedMuscle !== muscle)
      );

      return [...current, muscle];
    });
  }, []);

  const submit = useCallback((): NewExercise | null => {
    setAttemptedSubmit(true);

    if (
      trimmedName.length === 0 ||
      selectedPrimaryMuscles.length === 0 ||
      hasDuplicateName
    ) {
      return null;
    }

    return {
      name: trimmedName,
      category,
      primaryMuscles: JSON.stringify(selectedPrimaryMuscles),
      secondaryMuscles: JSON.stringify(selectedSecondaryMuscles),
      instructions: null,
      isCustom: 1,
      isArchived: 0
    };
  }, [
    category,
    hasDuplicateName,
    selectedPrimaryMuscles,
    selectedSecondaryMuscles,
    trimmedName
  ]);

  const reset = useCallback(() => {
    setName('');
    setCategory(DEFAULT_CATEGORY);
    setSelectedPrimaryMuscles([]);
    setSelectedSecondaryMuscles([]);
    setAttemptedSubmit(false);
  }, []);

  return {
    name,
    category,
    selectedPrimaryMuscles,
    selectedSecondaryMuscles,
    nameError,
    primaryMusclesError,
    setName,
    setCategory,
    togglePrimaryMuscle,
    toggleSecondaryMuscle,
    submit,
    reset
  };
}

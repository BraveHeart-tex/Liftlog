import type { NewExercise } from '@/src/db/schema';
import type { ExerciseCategory } from '@/src/features/exercises/exercise.constants';
import { useExerciseActions } from '@/src/features/exercises/hooks/use-exercise-actions';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import { useCallback, useState } from 'react';

interface UseCustomExerciseFormResult {
  name: string;
  category: ExerciseCategory;
  trackingType: TrackingType;
  selectedPrimaryMuscles: string[];
  selectedSecondaryMuscles: string[];
  nameError?: string;
  primaryMusclesError?: string;
  setName: (name: string) => void;
  setCategory: (category: ExerciseCategory) => void;
  setTrackingType: (trackingType: TrackingType) => void;
  togglePrimaryMuscle: (muscle: string) => void;
  toggleSecondaryMuscle: (muscle: string) => void;
  submit: () => NewExercise | null;
  reset: () => void;
}

interface UseCustomExerciseFormParams {
  initialName?: string;
}

const DEFAULT_CATEGORY: ExerciseCategory = 'barbell';
const DEFAULT_TRACKING_TYPE: TrackingType = 'weight_reps';

export function useCustomExerciseForm({
  initialName = ''
}: UseCustomExerciseFormParams = {}): UseCustomExerciseFormResult {
  const { hasCustomExerciseNameConflict } = useExerciseActions();
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<ExerciseCategory>(DEFAULT_CATEGORY);
  const [trackingType, setTrackingType] = useState<TrackingType>(
    DEFAULT_TRACKING_TYPE
  );
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<
    string[]
  >([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState<
    string[]
  >([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [hasDuplicateName, setHasDuplicateName] = useState(false);

  const trimmedName = name.trim();

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

  const updateName = useCallback((nextName: string) => {
    setName(nextName);
    setHasDuplicateName(false);
  }, []);

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

    const hasNameConflict =
      trimmedName.length > 0 &&
      hasCustomExerciseNameConflict(undefined, trimmedName);

    setHasDuplicateName(hasNameConflict);

    if (
      trimmedName.length === 0 ||
      selectedPrimaryMuscles.length === 0 ||
      hasNameConflict
    ) {
      return null;
    }

    return {
      name: trimmedName,
      category,
      trackingType,
      primaryMuscles: JSON.stringify(selectedPrimaryMuscles),
      secondaryMuscles: JSON.stringify(selectedSecondaryMuscles),
      isCustom: 1,
      isArchived: 0
    };
  }, [
    category,
    hasCustomExerciseNameConflict,
    selectedPrimaryMuscles,
    selectedSecondaryMuscles,
    trackingType,
    trimmedName
  ]);

  const reset = useCallback(() => {
    setName(initialName);
    setCategory(DEFAULT_CATEGORY);
    setTrackingType(DEFAULT_TRACKING_TYPE);
    setSelectedPrimaryMuscles([]);
    setSelectedSecondaryMuscles([]);
    setAttemptedSubmit(false);
    setHasDuplicateName(false);
  }, [initialName]);

  return {
    name,
    category,
    trackingType,
    selectedPrimaryMuscles,
    selectedSecondaryMuscles,
    nameError,
    primaryMusclesError,
    setName: updateName,
    setCategory,
    setTrackingType,
    togglePrimaryMuscle,
    toggleSecondaryMuscle,
    submit,
    reset
  };
}

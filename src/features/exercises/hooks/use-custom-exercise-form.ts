import type { NewExercise } from '@/src/db/schema';
import type { ExerciseCategory } from '@/src/features/exercises/exercise.constants';
import { normalizeExerciseName } from '@/src/features/exercises/exercise-name.utils';
import { useExerciseActions } from '@/src/features/exercises/hooks/use-exercise-actions';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import { useCallback, useState } from 'react';

interface UseCustomExerciseFormResult {
  name: string;
  equipment: ExerciseCategory | null;
  trackingType: TrackingType;
  selectedPrimaryMuscles: string[];
  selectedSecondaryMuscles: string[];
  nameError?: string;
  setName: (name: string) => void;
  setEquipment: (equipment: ExerciseCategory | null) => void;
  setTrackingType: (trackingType: TrackingType) => void;
  togglePrimaryMuscle: (muscle: string) => void;
  toggleSecondaryMuscle: (muscle: string) => void;
  submit: () => NewExercise | null;
  reportNameConflict: () => void;
  reset: () => void;
}

interface UseCustomExerciseFormParams {
  initialName?: string;
  reservedNames?: string[];
}

const DEFAULT_TRACKING_TYPE: TrackingType = 'weight_reps';

export function useCustomExerciseForm({
  initialName = '',
  reservedNames = []
}: UseCustomExerciseFormParams = {}): UseCustomExerciseFormResult {
  const { hasCustomExerciseNameConflict } = useExerciseActions();
  const [name, setName] = useState(initialName);
  const [equipment, setEquipment] = useState<ExerciseCategory | null>(null);
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
      (hasCustomExerciseNameConflict(undefined, trimmedName) ||
        reservedNames.some(
          reservedName =>
            normalizeExerciseName(reservedName) ===
            normalizeExerciseName(trimmedName)
        ));

    setHasDuplicateName(hasNameConflict);

    if (trimmedName.length === 0 || hasNameConflict) {
      return null;
    }

    return {
      name: trimmedName,
      equipment,
      trackingType,
      primaryMuscles: JSON.stringify(selectedPrimaryMuscles),
      secondaryMuscles: JSON.stringify(selectedSecondaryMuscles),
      isCustom: 1,
      isArchived: 0
    };
  }, [
    equipment,
    hasCustomExerciseNameConflict,
    reservedNames,
    selectedPrimaryMuscles,
    selectedSecondaryMuscles,
    trackingType,
    trimmedName
  ]);

  const reset = useCallback(() => {
    setName(initialName);
    setEquipment(null);
    setTrackingType(DEFAULT_TRACKING_TYPE);
    setSelectedPrimaryMuscles([]);
    setSelectedSecondaryMuscles([]);
    setAttemptedSubmit(false);
    setHasDuplicateName(false);
  }, [initialName]);

  const reportNameConflict = useCallback(() => {
    setAttemptedSubmit(true);
    setHasDuplicateName(true);
  }, []);

  return {
    name,
    equipment,
    trackingType,
    selectedPrimaryMuscles,
    selectedSecondaryMuscles,
    nameError,
    setName: updateName,
    setEquipment,
    setTrackingType,
    togglePrimaryMuscle,
    toggleSecondaryMuscle,
    submit,
    reportNameConflict,
    reset
  };
}

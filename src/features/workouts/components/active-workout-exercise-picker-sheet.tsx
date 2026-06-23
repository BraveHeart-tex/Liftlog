import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { useActiveWorkoutExercisePicker } from '@/src/features/workouts/hooks';
import { useCallback, useState } from 'react';

interface ActiveWorkoutExercisePickerSheetProps {
  isOpen: boolean;
  exerciseRows?: ExerciseListItem[];
  selectedExerciseIds: ExerciseListItem['id'][];
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseListItem) => void;
  onCreateCustomExercise: (initialName?: string) => void;
}

export function ActiveWorkoutExercisePickerSheet({
  isOpen,
  exerciseRows,
  selectedExerciseIds,
  onClose,
  onSelectExercise,
  onCreateCustomExercise
}: ActiveWorkoutExercisePickerSheetProps) {
  const [isContentReady, setIsContentReady] = useState(false);
  const shouldLoadExercises = isOpen && isContentReady;
  const {
    exerciseRows: pickerExerciseRows,
    recentExerciseIds,
    isLoading
  } = useActiveWorkoutExercisePicker({
    enabled: shouldLoadExercises,
    exerciseRows,
    selectedExerciseIds
  });
  const handleContentReadyChange = useCallback((isReady: boolean) => {
    setIsContentReady(isReady);
  }, []);

  return (
    <ExercisePickerSheet
      isOpen={isOpen}
      exercises={pickerExerciseRows}
      isLoading={isOpen && (!isContentReady || isLoading)}
      recentExerciseIds={recentExerciseIds}
      selectedExerciseIds={selectedExerciseIds}
      onContentReadyChange={handleContentReadyChange}
      onClose={onClose}
      onSelectExercise={onSelectExercise}
      onCreateCustomExercise={onCreateCustomExercise}
    />
  );
}

import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { ExercisePickerSheet } from '@/src/features/workouts/exercise-selection/components/exercise-picker-sheet';
import { useActiveWorkoutExercisePicker } from '@/src/features/workouts/exercise-selection/hooks/use-active-workout-exercise-picker';
import { useCallback, useState } from 'react';

interface ActiveWorkoutExercisePickerSheetCommonProps {
  isOpen: boolean;
  exerciseRows?: ExerciseListItem[];
  multipleDescription?: string;
  selectedExerciseIds: ExerciseListItem['id'][];
  onClose: () => void;
  onCreateCustomExercise: (initialName?: string) => void;
}

type ActiveWorkoutExercisePickerSheetProps =
  ActiveWorkoutExercisePickerSheetCommonProps &
    (
      | {
          mode?: 'single';
          onSelectExercise: (exercise: ExerciseListItem) => void;
        }
      | {
          mode: 'multiple';
          onSelectExercises: (exercises: ExerciseListItem[]) => void;
        }
    );

export function ActiveWorkoutExercisePickerSheet(
  props: ActiveWorkoutExercisePickerSheetProps
) {
  const {
    isOpen,
    exerciseRows,
    multipleDescription,
    selectedExerciseIds,
    onClose,
    onCreateCustomExercise
  } = props;
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
  const selectionProps =
    props.mode === 'multiple'
      ? {
          mode: 'multiple' as const,
          onSelectExercises: props.onSelectExercises
        }
      : {
          mode: 'single' as const,
          onSelectExercise: props.onSelectExercise
        };

  return (
    <ExercisePickerSheet
      {...selectionProps}
      isOpen={isOpen}
      exercises={pickerExerciseRows}
      isLoading={isOpen && (!isContentReady || isLoading)}
      recentExerciseIds={recentExerciseIds}
      multipleDescription={multipleDescription}
      selectedExerciseIds={selectedExerciseIds}
      onContentReadyChange={handleContentReadyChange}
      onClose={onClose}
      onCreateCustomExercise={onCreateCustomExercise}
    />
  );
}

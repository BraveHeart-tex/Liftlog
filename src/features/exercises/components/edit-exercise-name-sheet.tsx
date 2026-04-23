import { useDrizzle } from '@/src/components/database-provider';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Button } from '@/src/components/ui/button';
import type { Exercise } from '@/src/db/schema';
import {
  updateCustomExerciseName,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import { useEffect, useState } from 'react';
import { Keyboard, View } from 'react-native';

type EditExerciseNameSheetProps = {
  isOpen: boolean;
  exercise: Exercise;
  exercises: ExerciseListItem[];
  onClose: () => void;
};

const SNAP_POINTS = ['42%', '85%'];

export function EditExerciseNameSheet({
  isOpen,
  exercise,
  exercises,
  onClose
}: EditExerciseNameSheetProps) {
  const db = useDrizzle();
  const [name, setName] = useState(exercise.name);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    if (isOpen) {
      setName(exercise.name);
      setAttemptedSubmit(false);
      setFormError(undefined);
    }
  }, [exercise.name, isOpen]);

  const handleClose = () => {
    Keyboard.dismiss();
    setName(exercise.name);
    setAttemptedSubmit(false);
    setFormError(undefined);
    onClose();
  };

  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLocaleLowerCase();
  const hasDuplicateName = exercises.some(
    exerciseRow =>
      exerciseRow.id !== exercise.id &&
      exerciseRow.name.trim().toLocaleLowerCase() === normalizedName
  );
  const hasNameChanged = trimmedName !== exercise.name.trim();
  const shouldShowNameError = attemptedSubmit && trimmedName.length === 0;
  const shouldShowDuplicateError =
    attemptedSubmit && trimmedName.length > 0 && hasDuplicateName;

  const submit = () => {
    setAttemptedSubmit(true);
    setFormError(undefined);

    if (trimmedName.length === 0) {
      return;
    }

    if (!hasNameChanged) {
      handleClose();

      return;
    }

    if (hasDuplicateName) {
      return;
    }

    try {
      const updatedExercise = updateCustomExerciseName(
        db,
        exercise.id,
        trimmedName
      );

      if (!updatedExercise) {
        setFormError('Only custom exercises can be renamed');

        return;
      }
    } catch (error) {
      console.error('Failed to rename custom exercise', error);
      setFormError('Could not rename exercise. Try again.');

      return;
    }

    handleClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} snapPoints={SNAP_POINTS}>
      <BottomSheetHeader>
        <BottomSheetTitle>Rename exercise</BottomSheetTitle>
        <BottomSheetDescription>
          Update the name everywhere this custom exercise appears.
        </BottomSheetDescription>
      </BottomSheetHeader>

      <View className="px-4 pt-3 pb-4">
        <BottomSheetInput
          label="Name"
          value={name}
          onChangeText={nextName => {
            setName(nextName);
            setFormError(undefined);
          }}
          placeholder="Incline Bench Press"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
          error={
            shouldShowNameError
              ? 'Name is required'
              : shouldShowDuplicateError
                ? 'An exercise with this name already exists'
                : formError
          }
        />

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button variant="secondary" onPress={handleClose}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={submit}>Save</Button>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

export default EditExerciseNameSheet;

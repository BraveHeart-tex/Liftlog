import { StyledBottomSheetScrollView } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import type { NewExercise } from '@/src/db/schema';
import { ExerciseMetadataForm } from '@/src/features/exercises/components/exercise-metadata-form';
import { useCustomExerciseForm } from '@/src/features/exercises/hooks';
import { useEffect } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CreateCustomExerciseSheetProps {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onSave: (exercise: NewExercise) => void;
}

const SNAP_POINTS = ['72%'];

export function CreateCustomExerciseSheet({
  isOpen,
  initialName = '',
  onClose,
  onSave
}: CreateCustomExerciseSheetProps) {
  const insets = useSafeAreaInsets();
  const {
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
  } = useCustomExerciseForm({ initialName });

  useEffect(() => {
    reset();
  }, [isOpen, reset]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    const newExercise = submit();

    if (!newExercise) {
      return;
    }

    Keyboard.dismiss();
    onSave(newExercise);
    reset();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={SNAP_POINTS}
      androidKeyboardInputMode="adjustPan"
    >
      <BottomSheetHeader>
        <BottomSheetTitle>Create custom exercise</BottomSheetTitle>
        <BottomSheetDescription>
          Add it here and attach it to this workout right away.
        </BottomSheetDescription>
      </BottomSheetHeader>

      <StyledBottomSheetScrollView
        contentContainerClassName="px-4 pb-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <ExerciseMetadataForm
          inputVariant="bottom-sheet"
          name={name}
          category={category}
          selectedPrimaryMuscles={selectedPrimaryMuscles}
          selectedSecondaryMuscles={selectedSecondaryMuscles}
          nameError={nameError}
          primaryMusclesError={primaryMusclesError}
          setName={setName}
          setCategory={setCategory}
          togglePrimaryMuscle={togglePrimaryMuscle}
          toggleSecondaryMuscle={toggleSecondaryMuscle}
        />
      </StyledBottomSheetScrollView>

      <View
        className="border-border border-t px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="secondary" onPress={handleClose}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={handleSave}>Save</Button>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

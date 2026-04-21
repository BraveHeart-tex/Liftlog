import { useDrizzle } from '@/src/components/database-provider';
import { StyledBottomSheetScrollView } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import type { NewExercise } from '@/src/db/schema';
import {
  CATEGORY_FILTERS,
  MUSCLE_GROUP,
  type ExerciseCategory
} from '@/src/features/exercises/constants';
import {
  createExercise,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import { cn } from '@/src/lib/utils/cn';
import { toTitleCase } from '@/src/lib/utils/string';
import { useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';

interface CreateExerciseSheetProps {
  isOpen: boolean;
  exercises: ExerciseListItem[];
  onClose: () => void;
}

type CategoryOption = Extract<
  (typeof CATEGORY_FILTERS)[number],
  { readonly value: ExerciseCategory }
>;

const CATEGORY_OPTIONS = CATEGORY_FILTERS.filter(
  (category): category is CategoryOption => category.value !== 'all'
);

const PRIMARY_MUSCLE_OPTIONS = [
  MUSCLE_GROUP.chest,
  MUSCLE_GROUP.upperChest,
  MUSCLE_GROUP.shoulders,
  MUSCLE_GROUP.frontDelts,
  MUSCLE_GROUP.sideDelts,
  MUSCLE_GROUP.rearDelts,
  MUSCLE_GROUP.triceps,
  MUSCLE_GROUP.biceps,
  MUSCLE_GROUP.forearms,
  MUSCLE_GROUP.upperBack,
  MUSCLE_GROUP.lats,
  MUSCLE_GROUP.lowerBack,
  MUSCLE_GROUP.quads,
  MUSCLE_GROUP.hamstrings,
  MUSCLE_GROUP.glutes,
  MUSCLE_GROUP.calves,
  MUSCLE_GROUP.abs,
  MUSCLE_GROUP.obliques,
  MUSCLE_GROUP.hipFlexors,
  MUSCLE_GROUP.adductors
] as const;

export function CreateExerciseSheet({
  isOpen,
  exercises,
  onClose
}: CreateExerciseSheetProps) {
  const db = useDrizzle();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('barbell');
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<
    string[]
  >([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const resetForm = () => {
    setName('');
    setCategory('barbell');
    setSelectedPrimaryMuscles([]);
    setAttemptedSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const togglePrimaryMuscle = (muscle: string) => {
    setSelectedPrimaryMuscles(current =>
      current.includes(muscle)
        ? current.filter(selectedMuscle => selectedMuscle !== muscle)
        : [...current, muscle]
    );
  };

  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();
  const hasDuplicateName = exercises.some(
    exercise => exercise.name.trim().toLowerCase() === normalizedName
  );
  const shouldShowNameError = attemptedSubmit && trimmedName.length === 0;
  const shouldShowDuplicateError =
    attemptedSubmit && trimmedName.length > 0 && hasDuplicateName;
  const shouldShowPrimaryMusclesError =
    attemptedSubmit && selectedPrimaryMuscles.length === 0;

  const submit = () => {
    setAttemptedSubmit(true);

    if (
      trimmedName.length === 0 ||
      selectedPrimaryMuscles.length === 0 ||
      hasDuplicateName
    ) {
      return;
    }

    const newExercise: NewExercise = {
      name: trimmedName,
      category,
      primaryMuscles: JSON.stringify(selectedPrimaryMuscles),
      secondaryMuscles: JSON.stringify([]),
      instructions: null,
      isCustom: 1,
      isArchived: 0
    };

    createExercise(db, newExercise);
    handleClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={['70%', '90%']}
    >
      <BottomSheetHeader>
        <BottomSheetTitle>Create custom exercise</BottomSheetTitle>
        <BottomSheetDescription>
          Add only what you need for fast logging.
        </BottomSheetDescription>
      </BottomSheetHeader>

      <StyledBottomSheetScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-3 pb-8"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        onTouchStart={Keyboard.dismiss}
        showsVerticalScrollIndicator={false}
      >
        <BottomSheetInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Incline Bench Press"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          error={
            shouldShowNameError
              ? 'Name is required'
              : shouldShowDuplicateError
                ? 'An exercise with this name already exists'
                : undefined
          }
        />

        <View className="mt-6">
          <Text variant="small">Category</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {CATEGORY_OPTIONS.map(categoryOption => {
              const isSelected = category === categoryOption.value;

              return (
                <Pressable
                  key={categoryOption.value}
                  onPress={() => setCategory(categoryOption.value)}
                  className={cn(
                    'border-border rounded-full border px-4 py-3',
                    isSelected ? 'bg-primary' : 'bg-input'
                  )}
                >
                  <Text
                    variant="small"
                    className={cn(
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    )}
                  >
                    {categoryOption.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-6">
          <Text variant="small">Primary muscles</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            Pick at least one.
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {PRIMARY_MUSCLE_OPTIONS.map(muscle => {
              const isSelected = selectedPrimaryMuscles.includes(muscle);

              return (
                <Pressable
                  key={muscle}
                  onPress={() => togglePrimaryMuscle(muscle)}
                  className={cn(
                    'border-border rounded-full border px-4 py-3',
                    isSelected ? 'bg-primary' : 'bg-input'
                  )}
                >
                  <Text
                    variant="small"
                    className={cn(
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    )}
                  >
                    {toTitleCase(muscle)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {shouldShowPrimaryMusclesError ? (
            <Text variant="caption" tone="danger" className="mt-2">
              Select at least one primary muscle
            </Text>
          ) : null}
        </View>
      </StyledBottomSheetScrollView>

      <View className="border-border bg-card flex-row gap-3 border-t px-4 pt-3 pb-3">
        <View className="flex-1">
          <Button variant="secondary" onPress={handleClose}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button onPress={submit}>Save</Button>
        </View>
      </View>
    </BottomSheet>
  );
}

export default CreateExerciseSheet;

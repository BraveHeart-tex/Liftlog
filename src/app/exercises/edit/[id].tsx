import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseMetadataForm } from '@/src/features/exercises/components/exercise-metadata-form';
import type { ExerciseCategory } from '@/src/features/exercises/constants';
import {
  useCustomExerciseEdit,
  useExerciseActions
} from '@/src/features/exercises/hooks';
import { getRouteParamId } from '@/src/lib/utils/route';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, View } from 'react-native';

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const exerciseId = getRouteParamId(id);
  const { exercise, primaryMuscles, secondaryMuscles, isLoading } =
    useCustomExerciseEdit(exerciseId);
  const { updateCustomExerciseDetails } = useExerciseActions();
  const [category, setCategory] = useState<ExerciseCategory>('barbell');
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<
    string[]
  >([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState<
    string[]
  >([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!exercise || exercise.isCustom !== 1) {
      return;
    }

    setCategory(exercise.category as ExerciseCategory);
    setSelectedPrimaryMuscles(primaryMuscles);
    setSelectedSecondaryMuscles(secondaryMuscles);
    setAttemptedSubmit(false);
    setSaveError(undefined);
  }, [exercise, primaryMuscles, secondaryMuscles]);

  const primaryMusclesError =
    attemptedSubmit && selectedPrimaryMuscles.length === 0
      ? 'Select at least one primary muscle'
      : undefined;

  const handleCategoryChange = (nextCategory: ExerciseCategory) => {
    setCategory(nextCategory);
    setSaveError(undefined);
  };

  const togglePrimaryMuscle = (muscle: string) => {
    setSelectedPrimaryMuscles(current => {
      if (current.includes(muscle)) {
        return current.filter(selectedMuscle => selectedMuscle !== muscle);
      }

      setSelectedSecondaryMuscles(existing =>
        existing.filter(selectedMuscle => selectedMuscle !== muscle)
      );

      return [...current, muscle];
    });
    setSaveError(undefined);
  };

  const toggleSecondaryMuscle = (muscle: string) => {
    setSelectedSecondaryMuscles(current => {
      if (current.includes(muscle)) {
        return current.filter(selectedMuscle => selectedMuscle !== muscle);
      }

      setSelectedPrimaryMuscles(existing =>
        existing.filter(selectedMuscle => selectedMuscle !== muscle)
      );

      return [...current, muscle];
    });
    setSaveError(undefined);
  };

  const submit = () => {
    setAttemptedSubmit(true);

    if (
      !exercise ||
      exercise.isCustom !== 1 ||
      selectedPrimaryMuscles.length === 0
    ) {
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);
    Keyboard.dismiss();

    try {
      const updatedExercise = updateCustomExerciseDetails(exercise.id, {
        category,
        primaryMuscles: selectedPrimaryMuscles,
        secondaryMuscles: selectedSecondaryMuscles
      });

      if (!updatedExercise) {
        setSaveError('Only custom exercises can be edited.');
        setIsSaving(false);

        return;
      }

      router.replace({
        pathname: '/exercises/[id]',
        params: { id: updatedExercise.id }
      });
    } catch (error) {
      console.error('Failed to update custom exercise details', error);
      setSaveError('Could not update exercise details. Try again.');
      setIsSaving(false);
    }
  };

  if (exerciseId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading exercise..." />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Exercise not found
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          The exercise you&apos;re looking for doesn&apos;t exist.
        </Text>
      </Screen>
    );
  }

  if (exercise.isCustom !== 1) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Exercise can&apos;t be edited
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          Only custom exercises support detail editing.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="secondary" onPress={() => router.back()}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={submit} loading={isSaving} disabled={isSaving}>
              Save
            </Button>
          </View>
        </View>
      }
    >
      <View>
        <View className="flex-row items-center gap-3">
          <BackButton />
          <View className="flex-1">
            <Text variant="h1">Edit details</Text>
            <Text variant="small" tone="muted" className="mt-1">
              Update category and muscle groups for this custom exercise.
            </Text>
          </View>
        </View>

        <View className="mt-6">
          <ExerciseMetadataForm
            category={category}
            selectedPrimaryMuscles={selectedPrimaryMuscles}
            selectedSecondaryMuscles={selectedSecondaryMuscles}
            primaryMusclesError={primaryMusclesError}
            setCategory={handleCategoryChange}
            togglePrimaryMuscle={togglePrimaryMuscle}
            toggleSecondaryMuscle={toggleSecondaryMuscle}
          />
          {saveError ? (
            <Text variant="caption" tone="danger" className="mt-4">
              {saveError}
            </Text>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

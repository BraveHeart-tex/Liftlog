import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import type { NewExercise } from '@/src/db/schema';
import type { ExerciseCategory } from '@/src/features/exercises/constants';
import { CreateExerciseForm } from '@/src/features/exercises/components/create-exercise-form';
import {
  useExerciseActions,
  useExercises
} from '@/src/features/exercises/hooks';
import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, View } from 'react-native';

export default function NewExerciseScreen() {
  const exercises = useExercises();
  const { createCustomExercise } = useExerciseActions();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('barbell');
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<
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

  const togglePrimaryMuscle = (muscle: string) => {
    setSelectedPrimaryMuscles(current =>
      current.includes(muscle)
        ? current.filter(selectedMuscle => selectedMuscle !== muscle)
        : [...current, muscle]
    );
  };

  const createExercise = (newExercise: NewExercise) => {
    const createdExercise = createCustomExercise(newExercise);

    router.replace({
      pathname: '/(tabs)/exercises/[id]',
      params: { id: createdExercise.id }
    });
  };

  const submit = () => {
    setAttemptedSubmit(true);

    if (
      trimmedName.length === 0 ||
      selectedPrimaryMuscles.length === 0 ||
      hasDuplicateName
    ) {
      return;
    }

    Keyboard.dismiss();
    createExercise({
      name: trimmedName,
      category,
      primaryMuscles: JSON.stringify(selectedPrimaryMuscles),
      secondaryMuscles: JSON.stringify([]),
      instructions: null,
      isCustom: 1,
      isArchived: 0
    });
  };

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
            <Button onPress={submit}>Save</Button>
          </View>
        </View>
      }
    >
      <View>
        <View className="flex-row items-center gap-3">
          <BackButton />
          <View className="flex-1">
            <Text variant="h1">Create exercise</Text>
            <Text variant="small" tone="muted" className="mt-1">
              Add only what you need for fast logging.
            </Text>
          </View>
        </View>

        <View className="mt-6">
          <CreateExerciseForm
            name={name}
            category={category}
            selectedPrimaryMuscles={selectedPrimaryMuscles}
            nameError={nameError}
            primaryMusclesError={primaryMusclesError}
            setName={setName}
            setCategory={setCategory}
            togglePrimaryMuscle={togglePrimaryMuscle}
          />
        </View>
      </View>
    </Screen>
  );
}

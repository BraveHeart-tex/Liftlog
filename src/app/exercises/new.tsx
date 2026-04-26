import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseMetadataForm } from '@/src/features/exercises/components/exercise-metadata-form';
import {
  useExerciseActions,
  useCustomExerciseForm
} from '@/src/features/exercises/hooks';
import { router } from 'expo-router';
import { Keyboard, View } from 'react-native';

export default function NewExerciseScreen() {
  const { createCustomExercise } = useExerciseActions();
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
    submit: buildExercise
  } = useCustomExerciseForm();

  const createExercise = () => {
    const newExercise = buildExercise();

    if (!newExercise) {
      return;
    }

    const createdExercise = createCustomExercise(newExercise);

    router.replace({
      pathname: '/(tabs)/exercises/[id]',
      params: { id: createdExercise.id }
    });
  };

  const submit = () => {
    Keyboard.dismiss();
    createExercise();
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
          <ExerciseMetadataForm
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
        </View>
      </View>
    </Screen>
  );
}

import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Input } from '@/src/components/ui/input';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import {
  useExerciseActions,
  useExercises
} from '@/src/features/exercises/hooks';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { NewTemplateEmptyState } from '@/src/features/workouts/components/new-template-empty-state';
import { NewTemplateExerciseList } from '@/src/features/workouts/components/new-template-exercise-list';
import { useSaveWorkoutTemplate } from '@/src/features/workouts/hooks';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';

export function NewTemplateContent() {
  const exercises = useExercises();

  const { createCustomExercise } = useExerciseActions();
  const saveWorkoutTemplate = useSaveWorkoutTemplate();
  const isSavingRef = useRef(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<
    ExerciseListItem[]
  >([]);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const [initialCustomExerciseName, setInitialCustomExerciseName] =
    useState('');
  const canSave = name.trim().length > 0 && selectedExercises.length > 0;

  const deleteExercise = useCallback((exerciseId: ExerciseListItem['id']) => {
    setSelectedExercises(current =>
      current.filter(exercise => exercise.id !== exerciseId)
    );
  }, []);

  const selectExercise = (exercise: ExerciseListItem) => {
    setSelectedExercises(current => [...current, exercise]);
    setIsExercisePickerOpen(false);
  };

  const saveTemplate = () => {
    if (!canSave || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      saveWorkoutTemplate(
        name,
        selectedExercises.map((exercise, order) => ({
          exerciseId: exercise.id,
          order
        }))
      );
      router.back();
    } catch {
      isSavingRef.current = false;
      setIsSaving(false);
      Alert.alert('Could not save template', 'Please try again.');
    }
  };

  const handleBackPress = () => {
    const hasChanges = name.trim().length > 0 || selectedExercises.length > 0;

    if (!hasChanges) {
      router.back();

      return;
    }

    Alert.alert(
      'Discard template?',
      'Your changes will be lost if you leave this screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <Screen
      withPadding={false}
      footer={
        <Button
          className="w-full"
          disabled={!canSave}
          loading={isSaving}
          onPress={saveTemplate}
        >
          Save template
        </Button>
      }
    >
      <View className="px-4 pt-6">
        <View className="flex-row items-center gap-3">
          <BackButton onPress={handleBackPress} />
          <Text variant="h1">New template</Text>
        </View>

        <Input
          wrapperClassName="mt-6"
          label="Template name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Push day"
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </View>

      <View className="mt-6 flex-1">
        <View className="flex-row items-center justify-between px-4">
          <Text variant="overline" tone="muted">
            Exercises
          </Text>
          {selectedExercises.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-0 px-0 py-0"
              textClassName="text-primary text-sm"
              leftIcon={
                <Icon icon={PlusIcon} size="sm" className="text-primary" />
              }
              onPress={() => setIsExercisePickerOpen(true)}
            >
              Add
            </Button>
          )}
        </View>

        {selectedExercises.length === 0 ? (
          <View className="px-4">
            <NewTemplateEmptyState
              onAddExercise={() => setIsExercisePickerOpen(true)}
            />
          </View>
        ) : (
          <View className="mt-2 flex-1 px-4">
            <NewTemplateExerciseList
              exercises={selectedExercises}
              onDeleteExercise={deleteExercise}
              onReorderExercises={setSelectedExercises}
            />
          </View>
        )}
      </View>

      <ExercisePickerSheet
        isOpen={isExercisePickerOpen}
        exercises={exercises}
        selectedExerciseIds={selectedExercises.map(exercise => exercise.id)}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={selectExercise}
        onCreateCustomExercise={initialName => {
          Keyboard.dismiss();
          setInitialCustomExerciseName(initialName ?? '');
          setIsExercisePickerOpen(false);
          setIsCreateCustomExerciseOpen(true);
        }}
      />

      <CreateCustomExerciseSheet
        isOpen={isCreateCustomExerciseOpen}
        initialName={initialCustomExerciseName}
        onClose={() => setIsCreateCustomExerciseOpen(false)}
        onSave={newExercise => {
          const createdExercise = createCustomExercise(newExercise);

          setSelectedExercises(current => [...current, createdExercise]);
          setIsCreateCustomExerciseOpen(false);
        }}
      />
    </Screen>
  );
}

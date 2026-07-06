import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { useExerciseActions } from '@/src/features/exercises/hooks/use-exercise-actions';
import { useExercises } from '@/src/features/exercises/hooks/use-exercises';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { NewTemplateExerciseList } from '@/src/features/workouts/components/new-template-exercise-list';
import { ClipboardListIcon, PlusIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Keyboard, View } from 'react-native';

interface TemplateExerciseEditorProps {
  exercises: ExerciseListItem[];
  onChange: (exercises: ExerciseListItem[]) => void;
}

export function TemplateExerciseEditor({
  exercises,
  onChange
}: TemplateExerciseEditorProps) {
  const { createCustomExercise } = useExerciseActions();
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const { exercises: availableExercises, isLoading: isLoadingExercises } =
    useExercises({
      enabled: isExercisePickerOpen
    });
  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const [initialCustomExerciseName, setInitialCustomExerciseName] =
    useState('');
  const selectedExerciseIds = useMemo(
    () => exercises.map(exercise => exercise.id),
    [exercises]
  );
  const openExercisePicker = useCallback(
    () => setIsExercisePickerOpen(true),
    []
  );
  const closeExercisePicker = useCallback(
    () => setIsExercisePickerOpen(false),
    []
  );
  const openCreateCustomExercise = useCallback((initialName?: string) => {
    Keyboard.dismiss();
    setInitialCustomExerciseName(initialName ?? '');
    setIsExercisePickerOpen(false);
    setIsCreateCustomExerciseOpen(true);
  }, []);
  const closeCreateCustomExercise = useCallback(
    () => setIsCreateCustomExerciseOpen(false),
    []
  );

  const deleteExercise = useCallback(
    (exerciseId: ExerciseListItem['id']) => {
      onChange(exercises.filter(exercise => exercise.id !== exerciseId));
    },
    [exercises, onChange]
  );

  const selectExercises = useCallback(
    (selectedExercises: ExerciseListItem[]) => {
      onChange([...exercises, ...selectedExercises]);
    },
    [exercises, onChange]
  );

  const saveCustomExercise = useCallback(
    (newExercise: Parameters<typeof createCustomExercise>[0]) => {
      const createdExercise = createCustomExercise(newExercise);

      onChange([...exercises, createdExercise]);
      setIsCreateCustomExerciseOpen(false);
    },
    [createCustomExercise, exercises, onChange]
  );

  return (
    <>
      <View className="flex-row items-center justify-between px-4">
        <Text variant="overline" tone="muted">
          Exercises
        </Text>
        {exercises.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-0 px-0 py-0"
            textClassName="text-primary text-sm"
            leftIcon={<Icon as={PlusIcon} size="sm" tone="primary" />}
            onPress={openExercisePicker}
          >
            Add
          </Button>
        )}
      </View>

      {exercises.length === 0 ? (
        <View className="px-4">
          <EmptyState
            layout="section"
            icon={ClipboardListIcon}
            title="No exercises added"
            description="Add exercises from your library to build this template."
            className="py-8"
            action={
              <Button
                variant="secondary"
                size="sm"
                textClassName="text-primary text-sm"
                leftIcon={<Icon as={PlusIcon} size="sm" tone="primary" />}
                onPress={openExercisePicker}
              >
                Add exercise
              </Button>
            }
          />
        </View>
      ) : (
        <NewTemplateExerciseList
          exercises={exercises}
          onDeleteExercise={deleteExercise}
          onReorderExercises={onChange}
        />
      )}

      <ExercisePickerSheet
        mode="multiple"
        isOpen={isExercisePickerOpen}
        exercises={availableExercises}
        isLoading={isLoadingExercises}
        selectedExerciseIds={selectedExerciseIds}
        onClose={closeExercisePicker}
        onSelectExercises={selectExercises}
        onCreateCustomExercise={openCreateCustomExercise}
      />

      <CreateCustomExerciseSheet
        isOpen={isCreateCustomExerciseOpen}
        initialName={initialCustomExerciseName}
        onClose={closeCreateCustomExercise}
        onSave={saveCustomExercise}
      />
    </>
  );
}

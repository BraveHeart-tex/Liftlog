import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
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
import { PlusIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Keyboard, View } from 'react-native';

interface TemplateExerciseEditorProps {
  exercises: ExerciseListItem[];
  onChange: (exercises: ExerciseListItem[]) => void;
}

export function TemplateExerciseEditor({
  exercises,
  onChange
}: TemplateExerciseEditorProps) {
  const availableExercises = useExercises();
  const { createCustomExercise } = useExerciseActions();
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const [initialCustomExerciseName, setInitialCustomExerciseName] =
    useState('');

  const deleteExercise = useCallback(
    (exerciseId: ExerciseListItem['id']) => {
      onChange(exercises.filter(exercise => exercise.id !== exerciseId));
    },
    [exercises, onChange]
  );

  const selectExercises = (selectedExercises: ExerciseListItem[]) => {
    onChange([...exercises, ...selectedExercises]);
  };

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
            leftIcon={<Icon icon={PlusIcon} size="sm" tone="primary" />}
            onPress={() => setIsExercisePickerOpen(true)}
          >
            Add
          </Button>
        )}
      </View>

      {exercises.length === 0 ? (
        <View className="px-4">
          <NewTemplateEmptyState
            onAddExercise={() => setIsExercisePickerOpen(true)}
          />
        </View>
      ) : (
        <View className="mt-2 flex-1 px-4">
          <NewTemplateExerciseList
            exercises={exercises}
            onDeleteExercise={deleteExercise}
            onReorderExercises={onChange}
          />
        </View>
      )}

      <ExercisePickerSheet
        mode="multiple"
        isOpen={isExercisePickerOpen}
        exercises={availableExercises}
        selectedExerciseIds={exercises.map(exercise => exercise.id)}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercises={selectExercises}
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

          onChange([...exercises, createdExercise]);
          setIsCreateCustomExerciseOpen(false);
        }}
      />
    </>
  );
}

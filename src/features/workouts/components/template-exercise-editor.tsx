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
import { normalizeSupersetRows } from '@/src/features/workouts/superset.utils';
import { generateUuid } from '@/src/lib/utils/uuid.utils';
import { ClipboardListIcon, PlusIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Keyboard, View } from 'react-native';

interface TemplateExerciseEditorProps {
  rows: TemplateExerciseEditorRow[];
  onChange: (rows: TemplateExerciseEditorRow[]) => void;
}

export interface TemplateExerciseEditorRow {
  id: string;
  exercise: ExerciseListItem;
  supersetId: string | null;
}

export function TemplateExerciseEditor({
  rows,
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
    () => rows.map(row => row.exercise.id),
    [rows]
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
    (rowId: TemplateExerciseEditorRow['id']) => {
      onChange(normalizeSupersetRows(rows.filter(row => row.id !== rowId)));
    },
    [onChange, rows]
  );

  const selectExercises = useCallback(
    (selectedExercises: ExerciseListItem[]) => {
      onChange([
        ...rows,
        ...selectedExercises.map(exercise => ({
          id: generateUuid(),
          exercise,
          supersetId: null
        }))
      ]);
    },
    [onChange, rows]
  );

  const saveCustomExercise = useCallback(
    (newExercise: Parameters<typeof createCustomExercise>[0]) => {
      const createdExercise = createCustomExercise(newExercise);

      onChange([
        ...rows,
        {
          id: createdExercise.id,
          exercise: createdExercise,
          supersetId: null
        }
      ]);
      setIsCreateCustomExerciseOpen(false);
    },
    [createCustomExercise, onChange, rows]
  );

  return (
    <>
      <View className="flex-row items-center justify-between px-4">
        <Text variant="overline" tone="muted">
          Exercises
        </Text>
        {rows.length > 0 && (
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

      {rows.length === 0 ? (
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
          rows={rows}
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

import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { ActiveWorkoutEditHeader } from '@/src/features/workouts/components/active-workout-edit-header';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { ActiveWorkoutExercisePickerSheet } from '@/src/features/workouts/components/active-workout-exercise-picker-sheet';
import { ActiveWorkoutHeaderWithActions } from '@/src/features/workouts/components/active-workout-header-with-actions';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { HistoricalWorkoutHeader } from '@/src/features/workouts/components/historical-workout-header';
import { RestTimerWidget } from '@/src/features/workouts/components/rest-timer-widget';
import {
  useActiveWorkoutActions,
  useActiveWorkoutContent as useActiveWorkoutContentData,
  useReorderWorkoutExercises
} from '@/src/features/workouts/hooks';
import { PlusIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';

interface ActiveWorkoutContentProps {
  activeWorkout: Workout;
  exerciseRows?: ExerciseListItem[];
  mode?: 'active' | 'historical';
  onDiscardHistoricalWorkout?: (hasExercisesLogged: boolean) => void;
  onSaveHistoricalWorkout?: () => void;
}

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows,
  mode = 'active',
  onDiscardHistoricalWorkout,
  onSaveHistoricalWorkout
}: ActiveWorkoutContentProps) {
  const [isEditingExercises, setIsEditingExercises] = useState(false);

  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const [initialCustomExerciseName, setInitialCustomExerciseName] =
    useState('');
  const {
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    workoutExerciseRows,
    completedSetCount,
    isLoadingWorkoutExercises,
    exerciseById
  } = useActiveWorkoutContentData({ activeWorkout, exerciseRows });
  const { selectExercise, createAndSelectCustomExercise } =
    useActiveWorkoutActions({
      activeWorkout,
      workoutExerciseRows,
      isLoadingWorkoutExercises,
      setIsExercisePickerOpen
    });
  const reorderWorkoutExercises = useReorderWorkoutExercises(activeWorkout.id);

  const workoutName = activeWorkout.name;
  const hasExercisesLogged =
    !isLoadingWorkoutExercises && workoutExerciseRows.length > 0;
  const canSaveHistoricalWorkout = completedSetCount > 0;
  const selectedWorkoutExerciseIds = useMemo(
    () =>
      workoutExerciseRows.map(workoutExercise => workoutExercise.exerciseId),
    [workoutExerciseRows]
  );

  const enterEditMode = useCallback(() => setIsEditingExercises(true), []);
  const exitEditMode = useCallback(() => setIsEditingExercises(false), []);
  const openExercisePicker = useCallback(
    () => setIsExercisePickerOpen(true),
    [setIsExercisePickerOpen]
  );
  const closeExercisePicker = useCallback(
    () => setIsExercisePickerOpen(false),
    [setIsExercisePickerOpen]
  );
  const openCreateCustomExercise = useCallback(
    (initialName?: string) => {
      Keyboard.dismiss();
      setInitialCustomExerciseName(initialName ?? '');
      setIsExercisePickerOpen(false);
      setIsCreateCustomExerciseOpen(true);
    },
    [setIsExercisePickerOpen]
  );
  const closeCreateCustomExercise = useCallback(
    () => setIsCreateCustomExerciseOpen(false),
    []
  );
  const saveCustomExercise = useCallback(
    (exercise: Parameters<typeof createAndSelectCustomExercise>[0]) => {
      const createdExercise = createAndSelectCustomExercise(exercise);

      if (!createdExercise) {
        return;
      }

      setIsCreateCustomExerciseOpen(false);
    },
    [createAndSelectCustomExercise]
  );
  const handleReorderExercises = useCallback(
    (orderedWorkoutExerciseIds: WorkoutExercise['id'][]) => {
      try {
        reorderWorkoutExercises(orderedWorkoutExerciseIds);

        return true;
      } catch (error) {
        console.error('Failed to reorder workout exercises', error);
        Alert.alert('Could not reorder exercises', 'Please try again.');

        return false;
      }
    },
    [reorderWorkoutExercises]
  );

  useEffect(() => {
    if (isEditingExercises && workoutExerciseRows.length === 0) {
      setIsEditingExercises(false);
    }
  }, [isEditingExercises, workoutExerciseRows.length]);

  return (
    <Screen withPadding={false}>
      {isEditingExercises ? (
        <ActiveWorkoutEditHeader
          workoutName={workoutName}
          onDone={exitEditMode}
        />
      ) : mode === 'historical' ? (
        <HistoricalWorkoutHeader
          workoutName={workoutName}
          startedAt={activeWorkout.startedAt}
          canSave={canSaveHistoricalWorkout}
          onDiscard={() => onDiscardHistoricalWorkout?.(hasExercisesLogged)}
          onSave={onSaveHistoricalWorkout ?? (() => undefined)}
        />
      ) : (
        <ActiveWorkoutHeaderWithActions
          workoutName={workoutName}
          workoutId={activeWorkout.id}
          startedAt={activeWorkout.startedAt}
          canFinish={hasExercisesLogged}
          canSaveTemplate={hasExercisesLogged}
          workoutExerciseRows={workoutExerciseRows.map(workoutExercise => ({
            exerciseId: workoutExercise.exerciseId,
            order: workoutExercise.order
          }))}
        />
      )}

      {!isEditingExercises && mode === 'active' && <RestTimerWidget />}

      {isLoadingWorkoutExercises ? (
        <View className="flex-1 px-4">
          <LoadingState label="Loading exercises..." />
        </View>
      ) : workoutExerciseRows.length > 0 ? (
        <ActiveWorkoutExerciseList
          workoutExercises={workoutExerciseRows}
          exerciseById={exerciseById}
          mode={mode}
          isEditing={isEditingExercises}
          onEnterEditMode={enterEditMode}
          onReorderExercises={handleReorderExercises}
        />
      ) : (
        <View className="flex-1 px-4 pb-6">
          <EmptyState
            title="No exercises yet"
            description="Add your first exercise to get started."
            action={<Button onPress={openExercisePicker}>Add exercise</Button>}
          />
        </View>
      )}

      {!isEditingExercises &&
        !isLoadingWorkoutExercises &&
        workoutExerciseRows.length > 0 && (
          <View className="border-border bg-background border-t px-4 py-4">
            <Button
              variant="secondary"
              className="w-full"
              disabled={isLoadingWorkoutExercises}
              leftIcon={<Icon icon={PlusIcon} size="sm" tone="foreground" />}
              onPress={openExercisePicker}
            >
              Add exercise
            </Button>
          </View>
        )}

      <ActiveWorkoutExercisePickerSheet
        isOpen={isExercisePickerOpen}
        exerciseRows={exerciseRows}
        selectedExerciseIds={selectedWorkoutExerciseIds}
        onClose={closeExercisePicker}
        onSelectExercise={selectExercise}
        onCreateCustomExercise={openCreateCustomExercise}
      />

      <CreateCustomExerciseSheet
        isOpen={isCreateCustomExerciseOpen}
        initialName={initialCustomExerciseName}
        onClose={closeCreateCustomExercise}
        onSave={saveCustomExercise}
      />
    </Screen>
  );
}

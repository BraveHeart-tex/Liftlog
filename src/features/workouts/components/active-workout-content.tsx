import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { ActiveWorkoutEditHeader } from '@/src/features/workouts/components/active-workout-edit-header';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { ActiveWorkoutHeaderWithActions } from '@/src/features/workouts/components/active-workout-header-with-actions';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { EmptyExerciseState } from '@/src/features/workouts/components/empty-exercise-state';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { RestTimerWidget } from '@/src/features/workouts/components/rest-timer-widget';
import {
  useActiveWorkoutActions,
  useActiveWorkoutContent as useActiveWorkoutContentData,
  useReorderWorkoutExercises
} from '@/src/features/workouts/hooks';
import { formatDuration } from '@/src/lib/utils/date';
import { PlusIcon } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';

interface ActiveWorkoutContentProps {
  activeWorkout: Workout;
  exerciseRows: ExerciseListItem[];
}

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: ActiveWorkoutContentProps) {
  const [isEditingExercises, setIsEditingExercises] = useState(false);

  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const [initialCustomExerciseName, setInitialCustomExerciseName] =
    useState('');
  const {
    now,
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    workoutExerciseRows,
    recentExerciseIds,
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

  const enterEditMode = () => setIsEditingExercises(true);
  const exitEditMode = () => setIsEditingExercises(false);
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
      ) : (
        <ActiveWorkoutHeaderWithActions
          workoutName={workoutName}
          workoutId={activeWorkout.id}
          duration={formatDuration({
            startedAt: activeWorkout.startedAt,
            completedAt: now
          })}
          canFinish={hasExercisesLogged}
          canSaveTemplate={hasExercisesLogged}
          workoutExerciseRows={workoutExerciseRows.map(workoutExercise => ({
            exerciseId: workoutExercise.exerciseId,
            order: workoutExercise.order
          }))}
        />
      )}

      {!isEditingExercises && <RestTimerWidget />}

      {isLoadingWorkoutExercises ? (
        <View className="flex-1 px-4">
          <LoadingState label="Loading exercises..." />
        </View>
      ) : workoutExerciseRows.length > 0 ? (
        <ActiveWorkoutExerciseList
          workoutExercises={workoutExerciseRows}
          exerciseById={exerciseById}
          isEditing={isEditingExercises}
          onEnterEditMode={enterEditMode}
          onReorderExercises={handleReorderExercises}
        />
      ) : (
        <View className="flex-1 px-4 pb-6">
          <EmptyExerciseState
            onAddExercise={() => setIsExercisePickerOpen(true)}
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
              onPress={() => setIsExercisePickerOpen(true)}
            >
              Add exercise
            </Button>
          </View>
        )}

      <ExercisePickerSheet
        isOpen={isExercisePickerOpen}
        exercises={exerciseRows}
        recentExerciseIds={recentExerciseIds}
        selectedExerciseIds={workoutExerciseRows.map(
          workoutExercise => workoutExercise.exerciseId
        )}
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
        onSave={exercise => {
          const createdExercise = createAndSelectCustomExercise(exercise);

          if (!createdExercise) {
            return;
          }

          setIsCreateCustomExerciseOpen(false);
        }}
      />
    </Screen>
  );
}

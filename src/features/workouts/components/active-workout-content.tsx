import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { RenameSheet } from '@/src/components/ui/rename-sheet';
import { Screen } from '@/src/components/ui/screen';
import type { Workout } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { ActiveWorkoutActionsSheet } from '@/src/features/workouts/components/active-workout-actions-sheet';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { ActiveWorkoutHeader } from '@/src/features/workouts/components/active-workout-header';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { EmptyExerciseState } from '@/src/features/workouts/components/empty-exercise-state';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { RestTimerWidget } from '@/src/features/workouts/components/rest-timer-widget';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import {
  useActiveWorkoutActions,
  useActiveWorkoutContent as useActiveWorkoutContentData,
  useWorkoutDelete,
  useWorkoutRename
} from '@/src/features/workouts/hooks';
import { formatDuration } from '@/src/lib/utils/date';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';

interface ActiveWorkoutContentProps {
  activeWorkout: Workout;
  exerciseRows: ExerciseListItem[];
}

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: ActiveWorkoutContentProps) {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
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
  const { finishWorkout, selectExercise, createAndSelectCustomExercise } =
    useActiveWorkoutActions({
      activeWorkout,
      workoutExerciseRows,
      isLoadingWorkoutExercises,
      setIsExercisePickerOpen
    });
  const renameWorkout = useWorkoutRename();
  const deleteWorkout = useWorkoutDelete();
  const workoutName = activeWorkout.name;
  const canSaveTemplate =
    !isLoadingWorkoutExercises && workoutExerciseRows.length > 0;

  const openTemplateDialog = () => {
    if (!canSaveTemplate || isTemplateSheetOpen) {
      return;
    }

    setIsTemplateSheetOpen(true);
  };

  const confirmFinishWorkout = () => {
    Alert.alert(
      'Finish workout?',
      `"${workoutName}" will be saved to your workout history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: finishWorkout
        }
      ]
    );
  };

  const confirmDiscardWorkout = () => {
    Alert.alert(
      'Discard workout?',
      `"${workoutName}" and its logged exercises and sets will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            try {
              const didDelete = deleteWorkout(activeWorkout.id);

              if (!didDelete) {
                Alert.alert(
                  'Workout not found',
                  'This workout may have already been discarded.'
                );

                return;
              }

              router.replace('/(tabs)/workout');
            } catch (error) {
              console.error('Failed to discard workout', error);
              Alert.alert('Could not discard workout', 'Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleRenameWorkout = (nextName: string) => {
    try {
      const updatedWorkout = renameWorkout(activeWorkout, nextName);

      if (!updatedWorkout) {
        return 'Could not rename workout. Try again.';
      }
    } catch (error) {
      console.error('Failed to rename workout', error);

      return 'Could not rename workout. Try again.';
    }

    return undefined;
  };

  return (
    <Screen withPadding={false}>
      <ActiveWorkoutHeader
        workoutName={workoutName}
        duration={formatDuration({
          startedAt: activeWorkout.startedAt,
          completedAt: now
        })}
        canFinish={!isLoadingWorkoutExercises && workoutExerciseRows.length > 0}
        onOpenActions={() => setIsActionSheetOpen(true)}
        onFinish={confirmFinishWorkout}
      />

      <RestTimerWidget />

      <StyledScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoadingWorkoutExercises ? (
          <LoadingState label="Loading exercises..." />
        ) : workoutExerciseRows.length > 0 ? (
          <ActiveWorkoutExerciseList
            workoutExercises={workoutExerciseRows}
            exerciseById={exerciseById}
          />
        ) : (
          <EmptyExerciseState
            onAddExercise={() => setIsExercisePickerOpen(true)}
          />
        )}
      </StyledScrollView>

      {!isLoadingWorkoutExercises && workoutExerciseRows.length > 0 && (
        <View className="border-border bg-background border-t px-4 py-4">
          <Button
            variant="secondary"
            className="w-full"
            disabled={isLoadingWorkoutExercises}
            leftIcon={
              <Icon icon={PlusIcon} size="sm" className="text-foreground" />
            }
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

      <ActiveWorkoutActionsSheet
        isOpen={isActionSheetOpen}
        canSaveTemplate={canSaveTemplate}
        onClose={() => setIsActionSheetOpen(false)}
        onRename={() => setIsRenameSheetOpen(true)}
        onSaveTemplate={openTemplateDialog}
        onDiscard={confirmDiscardWorkout}
      />

      <RenameSheet
        isOpen={isRenameSheetOpen}
        title="Rename workout"
        description="Update the name shown while this workout is in progress."
        inputLabel="Workout name"
        initialName={workoutName}
        requiredMessage="Workout name is required."
        fallbackErrorMessage="Could not rename workout. Try again."
        onClose={() => setIsRenameSheetOpen(false)}
        onSubmit={handleRenameWorkout}
      />

      <SaveWorkoutTemplateSheet
        isOpen={isTemplateSheetOpen}
        initialName={workoutName}
        workoutExerciseRows={workoutExerciseRows.map(workoutExercise => ({
          exerciseId: workoutExercise.exerciseId,
          order: workoutExercise.order
        }))}
        onClose={() => setIsTemplateSheetOpen(false)}
      />
    </Screen>
  );
}

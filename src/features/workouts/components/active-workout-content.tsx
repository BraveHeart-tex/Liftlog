import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { StyledTextInput } from '@/src/components/styled/text-input';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import {
  useActiveWorkoutActions,
  useActiveWorkoutContent as useActiveWorkoutContentData,
  useWorkoutDelete,
  useWorkoutRename,
  useWorkoutRenameFlow
} from '@/src/features/workouts/hooks';
import { ActiveWorkoutActionsSheet } from '@/src/features/workouts/components/active-workout-actions-sheet';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { EmptyExerciseState } from '@/src/features/workouts/components/empty-exercise-state';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { RestTimerSheet } from '@/src/features/workouts/components/rest-timer-sheet';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import { formatDuration } from '@/src/lib/utils/date';
import { EllipsisVerticalIcon, PlusIcon, TimerIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { router } from 'expo-router';

interface ActiveWorkoutContentProps {
  activeWorkout: Workout;
  exerciseRows: ExerciseListItem[];
}

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: ActiveWorkoutContentProps) {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const {
    now,
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    isRestTimerOpen,
    setIsRestTimerOpen,
    workoutExerciseRows,
    isLoadingWorkoutExercises,
    exerciseById,
    isRestTimerRunning
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
  const {
    inputRef: renameInputRef,
    name: workoutName,
    draftName,
    renameError,
    isRenaming,
    isSavingRename,
    beginRename,
    cancelRename,
    setDraftName,
    submitRename
  } = useWorkoutRenameFlow({
    workout: activeWorkout,
    renameWorkout
  });
  const canSaveTemplate =
    !isLoadingWorkoutExercises && workoutExerciseRows.length > 0;

  const openTemplateDialog = () => {
    if (!canSaveTemplate || isTemplateSheetOpen) {
      return;
    }

    setIsTemplateSheetOpen(true);
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

  return (
    <Screen withPadding={false}>
      <View className="flex-row items-center justify-between gap-2 px-4 pt-4 pb-2">
        <BackButton onPress={isRenaming ? cancelRename : undefined} />

        <View className="flex-1">
          {isRenaming ? (
            <StyledTextInput
              ref={renameInputRef}
              className="text-h2 text-foreground border-border rounded-md border-b py-1"
              selectionClassName="text-primary"
              value={draftName}
              onChangeText={setDraftName}
              accessibilityLabel="Workout name"
              autoCapitalize="words"
              autoCorrect={false}
              blurOnSubmit={false}
              enterKeyHint="done"
              returnKeyType="done"
              maxLength={80}
              selectTextOnFocus
              submitBehavior="submit"
              onSubmitEditing={submitRename}
            />
          ) : (
            <Text variant="h2" numberOfLines={1}>
              {workoutName}
            </Text>
          )}
          {renameError ? (
            <Text variant="caption" tone="danger" className="mt-2">
              {renameError}
            </Text>
          ) : null}
        </View>

        <Button
          variant="ghost"
          size="icon"
          disabled={isRenaming || isSavingRename}
          onPress={() => setIsRestTimerOpen(true)}
        >
          <Icon icon={TimerIcon} size={20} className="text-foreground" />
          {isRestTimerRunning ? (
            <View className="bg-primary absolute top-0 right-0 h-2 w-2 rounded-full" />
          ) : null}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Workout actions"
          disabled={isRenaming || isSavingRename}
          onPress={() => setIsActionSheetOpen(true)}
        >
          <Icon
            icon={EllipsisVerticalIcon}
            size={20}
            className="text-foreground"
          />
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={
            isRenaming ||
            isSavingRename ||
            isLoadingWorkoutExercises ||
            workoutExerciseRows.length === 0
          }
          onPress={finishWorkout}
        >
          Finish
        </Button>
      </View>

      <View className="px-4 pb-3">
        <Text variant="caption" tone="muted">
          {formatDuration({
            startedAt: activeWorkout.startedAt,
            completedAt: now
          })}
        </Text>
      </View>

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

      <View className="border-border bg-background border-t px-4 py-4">
        <Button
          variant="secondary"
          className="w-full"
          disabled={isLoadingWorkoutExercises}
          leftIcon={
            <Icon icon={PlusIcon} size={16} className="text-foreground" />
          }
          onPress={() => setIsExercisePickerOpen(true)}
        >
          Add exercise
        </Button>
      </View>

      <ExercisePickerSheet
        isOpen={isExercisePickerOpen}
        exercises={exerciseRows}
        selectedExerciseIds={workoutExerciseRows.map(
          workoutExercise => workoutExercise.exerciseId
        )}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={selectExercise}
        onCreateCustomExercise={() => {
          Keyboard.dismiss();
          setIsExercisePickerOpen(false);
          setIsCreateCustomExerciseOpen(true);
        }}
      />

      <CreateCustomExerciseSheet
        isOpen={isCreateCustomExerciseOpen}
        onClose={() => setIsCreateCustomExerciseOpen(false)}
        onSave={exercise => {
          const createdExercise = createAndSelectCustomExercise(exercise);

          if (!createdExercise) {
            return;
          }

          setIsCreateCustomExerciseOpen(false);
        }}
      />

      <RestTimerSheet
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
      />

      <ActiveWorkoutActionsSheet
        isOpen={isActionSheetOpen}
        canSaveTemplate={canSaveTemplate}
        onClose={() => setIsActionSheetOpen(false)}
        onRename={beginRename}
        onSaveTemplate={openTemplateDialog}
        onDiscard={confirmDiscardWorkout}
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

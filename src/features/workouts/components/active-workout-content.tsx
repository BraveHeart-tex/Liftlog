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
  useWorkoutRename
} from '@/src/features/workouts/hooks';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { EmptyExerciseState } from '@/src/features/workouts/components/empty-exercise-state';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { RestTimerSheet } from '@/src/features/workouts/components/rest-timer-sheet';
import { formatDuration } from '@/src/lib/utils/date';
import { PlusIcon, TimerIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, View, type TextInput } from 'react-native';

type ActiveWorkoutContentProps = {
  activeWorkout: Workout;
  exerciseRows: ExerciseListItem[];
};

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: ActiveWorkoutContentProps) {
  const renameInputRef = useRef<TextInput>(null);
  const isSavingRenameRef = useRef(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [renameError, setRenameError] = useState<string | undefined>();
  const [isSavingRename, setIsSavingRename] = useState(false);
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
  const { finishWorkout, selectExercise } = useActiveWorkoutActions({
    activeWorkout,
    workoutExerciseRows,
    isLoadingWorkoutExercises,
    setIsExercisePickerOpen
  });
  const renameWorkout = useWorkoutRename();

  useEffect(() => {
    if (!isRenaming) {
      return;
    }

    setDraftName(activeWorkout.name);
    setRenameError(undefined);
    const focusTimer = setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.setSelection(0, activeWorkout.name.length);
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [activeWorkout.name, isRenaming]);

  const beginRename = () => {
    if (isRenaming) {
      return;
    }

    setDraftName(activeWorkout.name);
    setRenameError(undefined);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    Keyboard.dismiss();
    isSavingRenameRef.current = false;
    setDraftName(activeWorkout.name);
    setRenameError(undefined);
    setIsSavingRename(false);
    setIsRenaming(false);
  };

  const submitRename = () => {
    if (isSavingRenameRef.current) {
      return;
    }

    isSavingRenameRef.current = true;
    setIsSavingRename(true);
    setRenameError(undefined);

    try {
      const updatedWorkout = renameWorkout(activeWorkout, draftName);

      if (!updatedWorkout) {
        setRenameError('Could not rename workout. Try again.');
        isSavingRenameRef.current = false;
        setIsSavingRename(false);

        return;
      }
    } catch (error) {
      console.error('Failed to rename workout', error);
      setRenameError('Could not rename workout. Try again.');
      isSavingRenameRef.current = false;
      setIsSavingRename(false);

      return;
    }

    Keyboard.dismiss();
    isSavingRenameRef.current = false;
    setIsSavingRename(false);
    setIsRenaming(false);
  };

  return (
    <Screen withPadding={false}>
      <View className="flex-row items-center justify-between gap-4 px-4 pt-4 pb-2">
        <BackButton onPress={isRenaming ? cancelRename : undefined} />

        <View className="flex-1">
          {isRenaming ? (
            <StyledTextInput
              ref={renameInputRef}
              className="text-h2 text-foreground border-border rounded-md border-b py-1"
              selectionClassName="text-primary"
              value={draftName}
              onChangeText={nextName => {
                setDraftName(nextName);
                setRenameError(undefined);
              }}
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rename workout"
              onPress={beginRename}
            >
              <Text variant="h2" numberOfLines={1}>
                {activeWorkout.name}
              </Text>
            </Pressable>
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
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={selectExercise}
      />

      <RestTimerSheet
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
      />
    </Screen>
  );
}

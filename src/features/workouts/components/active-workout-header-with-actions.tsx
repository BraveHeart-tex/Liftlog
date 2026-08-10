import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { RenameSheet } from '@/src/components/ui/rename-sheet';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { Text } from '@/src/components/ui/text';
import type { Workout, WorkoutExercise } from '@/src/db';
import { ActiveWorkoutActionsSheet } from '@/src/features/workouts/components/active-workout-actions-sheet';
import { ActiveWorkoutHeaderDuration } from '@/src/features/workouts/components/active-workout-header-duration';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import { useWorkoutDelete } from '@/src/features/workouts/hooks/use-workout-delete';
import { useWorkoutRename } from '@/src/features/workouts/hooks/use-workout-rename';
import { Stack, router } from 'expo-router';
import { EllipsisIcon } from 'lucide-react-native';
import { Fragment, useCallback, useState } from 'react';
import { View } from 'react-native';

interface ActiveWorkoutHeaderWithActionsProps {
  workoutName: string;
  workoutId: Workout['id'];
  startedAt: Workout['startedAt'];
  canSaveTemplate: boolean;
  exerciseCount: number;
  completedSetCount: number;
  workoutExerciseRows: Pick<
    WorkoutExercise,
    'exerciseId' | 'order' | 'supersetId'
  >[];
}

export const ActiveWorkoutHeaderWithActions = ({
  workoutName,
  workoutId,
  startedAt,
  canSaveTemplate,
  exerciseCount,
  completedSetCount,
  workoutExerciseRows
}: ActiveWorkoutHeaderWithActionsProps) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const hasWorkoutExercises = exerciseCount > 0;

  const renameWorkout = useWorkoutRename();
  const deleteWorkout = useWorkoutDelete();

  const openActions = useCallback(() => setIsActionSheetOpen(true), []);
  const closeActions = useCallback(() => setIsActionSheetOpen(false), []);
  const openRenameSheet = useCallback(() => setIsRenameSheetOpen(true), []);
  const closeRenameSheet = useCallback(() => setIsRenameSheetOpen(false), []);
  const closeTemplateSheet = useCallback(
    () => setIsTemplateSheetOpen(false),
    []
  );

  const openTemplateDialog = useCallback(() => {
    if (!canSaveTemplate || isTemplateSheetOpen) {
      return;
    }

    setIsTemplateSheetOpen(true);
  }, [canSaveTemplate, isTemplateSheetOpen]);

  const confirmDiscardWorkout = useCallback(() => {
    void confirmDialog({
      title: 'Discard workout?',
      message: `"${workoutName}" and its logged exercises and sets will be permanently removed.`,
      confirmLabel: 'Discard',
      destructive: true
    }).then(confirmed => {
      if (!confirmed) {
        return;
      }

      try {
        const didDelete = deleteWorkout(workoutId);

        if (!didDelete) {
          showSnackbar({
            message: 'This workout may have already been discarded.',
            variant: 'warning'
          });

          return;
        }

        router.replace('/(tabs)/workout');
      } catch (error) {
        console.error('Failed to discard workout', error);
        showSnackbar({
          message: 'Could not discard workout. Please try again.',
          variant: 'danger'
        });
      }
    });
  }, [deleteWorkout, workoutId, workoutName]);

  const handleRenameWorkout = useCallback(
    (nextName: string) => {
      try {
        const updatedWorkout = renameWorkout({
          workoutId,
          nextName
        });

        if (!updatedWorkout) {
          return 'Could not rename workout. Try again.';
        }
      } catch (error) {
        console.error('Failed to rename workout', error);

        return 'Could not rename workout. Try again.';
      }

      return undefined;
    },
    [renameWorkout, workoutId]
  );

  return (
    <Fragment>
      <Stack.Screen
        options={{
          title: 'Active workout',
          headerLeft: undefined,
          headerTitleAlign: undefined,
          headerRight: () => (
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Workout actions"
              onPress={openActions}
            >
              <Icon as={EllipsisIcon} size="lg" tone="foreground" />
            </Button>
          )
        }}
      />

      <View
        className={hasWorkoutExercises ? 'px-4 pt-3 pb-2' : 'px-4 pt-4 pb-3'}
      >
        <Text variant={hasWorkoutExercises ? 'h3' : 'h2'} numberOfLines={1}>
          {workoutName}
        </Text>
        <ActiveWorkoutHeaderDuration
          startedAt={startedAt}
          exerciseCount={hasWorkoutExercises ? exerciseCount : undefined}
          completedSetCount={
            hasWorkoutExercises ? completedSetCount : undefined
          }
        />
      </View>

      {isActionSheetOpen ? (
        <ActiveWorkoutActionsSheet
          isOpen
          canSaveTemplate={canSaveTemplate}
          onClose={closeActions}
          onRename={openRenameSheet}
          onSaveTemplate={openTemplateDialog}
          onDiscard={confirmDiscardWorkout}
        />
      ) : null}

      {isRenameSheetOpen ? (
        <RenameSheet
          isOpen
          title="Rename workout"
          description="Update the name shown while this workout is in progress."
          inputLabel="Workout name"
          initialName={workoutName}
          requiredMessage="Workout name is required."
          fallbackErrorMessage="Could not rename workout. Try again."
          onClose={closeRenameSheet}
          onSubmit={handleRenameWorkout}
        />
      ) : null}

      {isTemplateSheetOpen ? (
        <SaveWorkoutTemplateSheet
          isOpen
          initialName={workoutName}
          workoutExerciseRows={workoutExerciseRows}
          onClose={closeTemplateSheet}
        />
      ) : null}
    </Fragment>
  );
};

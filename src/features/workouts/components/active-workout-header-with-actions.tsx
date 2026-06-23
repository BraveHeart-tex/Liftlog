import { RenameSheet } from '@/src/components/ui/rename-sheet';
import type { Workout, WorkoutExercise } from '@/src/db';
import { ActiveWorkoutActionsSheet } from '@/src/features/workouts/components/active-workout-actions-sheet';
import { ActiveWorkoutHeader } from '@/src/features/workouts/components/active-workout-header';
import { ActiveWorkoutHeaderDuration } from '@/src/features/workouts/components/active-workout-header-duration';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import {
  useWorkoutDelete,
  useWorkoutRename
} from '@/src/features/workouts/hooks';
import { router } from 'expo-router';
import { Fragment, useCallback, useState } from 'react';
import { Alert } from 'react-native';

interface ActiveWorkoutHeaderWithActionsProps {
  workoutName: string;
  workoutId: Workout['id'];
  startedAt: Workout['startedAt'];
  canFinish: boolean;
  canSaveTemplate: boolean;
  workoutExerciseRows: Pick<WorkoutExercise, 'exerciseId' | 'order'>[];
}

export const ActiveWorkoutHeaderWithActions = ({
  workoutName,
  workoutId,
  startedAt,
  canFinish,
  canSaveTemplate,
  workoutExerciseRows
}: ActiveWorkoutHeaderWithActionsProps) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);

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
              const didDelete = deleteWorkout(workoutId);

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
      <ActiveWorkoutHeader
        workoutName={workoutName}
        workoutId={workoutId}
        duration={<ActiveWorkoutHeaderDuration startedAt={startedAt} />}
        canFinish={canFinish}
        onOpenActions={openActions}
      />

      <ActiveWorkoutActionsSheet
        isOpen={isActionSheetOpen}
        canSaveTemplate={canSaveTemplate}
        onClose={closeActions}
        onRename={openRenameSheet}
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
        onClose={closeRenameSheet}
        onSubmit={handleRenameWorkout}
      />

      <SaveWorkoutTemplateSheet
        isOpen={isTemplateSheetOpen}
        initialName={workoutName}
        workoutExerciseRows={workoutExerciseRows}
        onClose={closeTemplateSheet}
      />
    </Fragment>
  );
};

import { RenameSheet } from '@/src/components/ui/rename-sheet';
import type { Workout, WorkoutExercise } from '@/src/db';
import { ActiveWorkoutActionsSheet } from '@/src/features/workouts/components/active-workout-actions-sheet';
import { ActiveWorkoutHeader } from '@/src/features/workouts/components/active-workout-header';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import {
  useWorkoutDelete,
  useWorkoutRename
} from '@/src/features/workouts/hooks';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Alert } from 'react-native';

interface ActiveWorkoutHeaderWithActionsProps {
  workoutName: string;
  workoutId: Workout['id'];
  duration: string;
  canFinish: boolean;
  canSaveTemplate: boolean;
  workoutExerciseRows: Pick<WorkoutExercise, 'exerciseId' | 'order'>[];
}

export const ActiveWorkoutHeaderWithActions = ({
  workoutName,
  workoutId,
  duration,
  canFinish,
  canSaveTemplate,
  workoutExerciseRows
}: ActiveWorkoutHeaderWithActionsProps) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);

  const renameWorkout = useWorkoutRename();
  const deleteWorkout = useWorkoutDelete();

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
  };

  const handleRenameWorkout = (nextName: string) => {
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
  };

  return (
    <Fragment>
      <ActiveWorkoutHeader
        workoutName={workoutName}
        workoutId={workoutId}
        duration={duration}
        canFinish={canFinish}
        onOpenActions={() => setIsActionSheetOpen(true)}
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
        workoutExerciseRows={workoutExerciseRows}
        onClose={() => setIsTemplateSheetOpen(false)}
      />
    </Fragment>
  );
};

import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { ActiveWorkoutContent } from '@/src/features/workouts/components/active-workout-content';
import { useHistoricalWorkoutEditActions } from '@/src/features/workouts/hooks/use-historical-workout-edit-actions';
import { useHistoricalWorkoutEditScreen } from '@/src/features/workouts/hooks/use-historical-workout-edit-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useCallback } from 'react';

export default function HistoricalWorkoutEditScreen() {
  const { id, sourceWorkoutId: rawSourceWorkoutId } = useLocalSearchParams<{
    id?: string | string[];
    sourceWorkoutId?: string | string[];
  }>();
  const draftWorkoutId = getRouteParamId(id);
  const sourceWorkoutId = getRouteParamId(rawSourceWorkoutId);
  const { draftWorkout, sourceWorkout, isLoading } =
    useHistoricalWorkoutEditScreen({ draftWorkoutId, sourceWorkoutId });
  const { saveDraft, discardDraft } = useHistoricalWorkoutEditActions();

  const discardEditDraft = useCallback(
    (hasExercisesLogged: boolean) => {
      if (!draftWorkout) {
        return true;
      }

      const discard = () => {
        try {
          if (!discardDraft(draftWorkout.id)) {
            showSnackbar({
              message: 'These edits may have already been discarded.',
              variant: 'warning'
            });

            return false;
          }

          showSnackbar({ message: 'Edits discarded.', variant: 'success' });
        } catch (error) {
          console.error('Failed to discard workout edits', error);
          showSnackbar({
            message: 'Could not discard edits. Please try again.',
            variant: 'danger'
          });

          return false;
        }

        return true;
      };

      if (!hasExercisesLogged) {
        return discard();
      }

      return confirmDialog({
        title: 'Discard changes?',
        message: `Your edits to "${draftWorkout.name}" will be removed.`,
        confirmLabel: 'Discard',
        destructive: true
      }).then(confirmed => {
        return confirmed ? discard() : false;
      });
    },
    [discardDraft, draftWorkout]
  );

  const saveEditDraft = useCallback(() => {
    if (!draftWorkout || !sourceWorkout) {
      return false;
    }

    try {
      const savedWorkout = saveDraft({
        sourceWorkoutId: sourceWorkout.id,
        draftWorkoutId: draftWorkout.id
      });

      if (!savedWorkout) {
        showSnackbar({
          message: 'Log at least one completed set before saving these edits.',
          variant: 'warning'
        });

        return false;
      }

      router.dismissTo({
        pathname: '/workouts/[id]',
        params: { id: savedWorkout.id }
      });

      return true;
    } catch (error) {
      console.error('Failed to save workout edits', error);
      showSnackbar({
        message: 'Could not save edits. Please try again.',
        variant: 'danger'
      });

      return false;
    }
  }, [draftWorkout, saveDraft, sourceWorkout]);

  if (draftWorkoutId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading workout..." />
      </Screen>
    );
  }

  if (!draftWorkout || !sourceWorkout) {
    return (
      <Screen withPadding={false} contentClassName="px-6">
        <EmptyState className="flex-1 px-8">
          <EmptyState.Title weight="semiBold">
            Workout not found
          </EmptyState.Title>
          <EmptyState.Description>
            This edit draft may have already been saved or discarded.
          </EmptyState.Description>
          <EmptyState.Action>
            <Button
              leftIcon={<Icon as={ArrowLeftIcon} tone="primaryForeground" />}
              onPress={() => router.replace('/(tabs)/log')}
            >
              Go back
            </Button>
          </EmptyState.Action>
        </EmptyState>
      </Screen>
    );
  }

  return (
    <ActiveWorkoutContent
      activeWorkout={draftWorkout}
      mode="historical-edit"
      onDiscardHistoricalWorkout={discardEditDraft}
      onSaveHistoricalWorkout={saveEditDraft}
    />
  );
}

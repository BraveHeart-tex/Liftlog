import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { ActiveWorkoutContent } from '@/src/features/workouts/components/active-workout-content';
import { useHistoricalWorkoutDraftActions } from '@/src/features/workouts/hooks/use-historical-workout-draft-actions';
import { useHistoricalWorkoutDraftScreen } from '@/src/features/workouts/hooks/use-historical-workout-draft-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useCallback } from 'react';

export default function HistoricalWorkoutDraftScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getRouteParamId(id);
  const { historicalWorkout, isLoading } =
    useHistoricalWorkoutDraftScreen(workoutId);
  const { saveDraft, discardDraft } = useHistoricalWorkoutDraftActions();

  const discardHistoricalWorkout = useCallback(
    (hasExercisesLogged: boolean) => {
      if (!historicalWorkout) {
        return true;
      }

      const discard = () => {
        discardDraft(historicalWorkout.id);

        return true;
      };

      if (!hasExercisesLogged) {
        return discard();
      }

      return confirmDialog({
        title: 'Discard workout?',
        message: `"${historicalWorkout.name}" and its logged exercises and sets will be removed.`,
        confirmLabel: 'Discard',
        destructive: true
      }).then(confirmed => {
        return confirmed ? discard() : false;
      });
    },
    [discardDraft, historicalWorkout]
  );

  const saveHistoricalWorkout = useCallback(() => {
    if (!historicalWorkout) {
      return false;
    }

    try {
      const savedWorkout = saveDraft(historicalWorkout.id);

      if (!savedWorkout) {
        showSnackbar({
          message: 'Log at least one completed set before saving this workout.',
          variant: 'warning'
        });

        return false;
      }

      router.replace({
        pathname: '/workouts/[id]',
        params: { id: savedWorkout.id }
      });

      return true;
    } catch (error) {
      console.error('Failed to save historical workout', error);
      showSnackbar({
        message: 'Could not save workout. Please try again.',
        variant: 'danger'
      });

      return false;
    }
  }, [historicalWorkout, saveDraft]);

  if (workoutId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading workout..." />
      </Screen>
    );
  }

  if (!historicalWorkout) {
    return (
      <Screen withPadding={false} contentClassName="px-6">
        <EmptyState
          title="Workout not found"
          description="This draft may have already been saved or discarded."
          action={
            <Button
              leftIcon={<Icon as={ArrowLeftIcon} tone="primaryForeground" />}
              onPress={() => router.replace('/(tabs)/log')}
            >
              Go back
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <ActiveWorkoutContent
      activeWorkout={historicalWorkout}
      mode="historical"
      onDiscardHistoricalWorkout={discardHistoricalWorkout}
      onSaveHistoricalWorkout={saveHistoricalWorkout}
    />
  );
}

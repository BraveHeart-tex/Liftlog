import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { ActiveWorkoutContent } from '@/src/features/workouts/components/active-workout-content';
import { useHistoricalWorkoutDraftActions } from '@/src/features/workouts/hooks/use-historical-workout-draft-actions';
import { useHistoricalWorkoutDraftScreen } from '@/src/features/workouts/hooks/use-historical-workout-draft-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export default function HistoricalWorkoutDraftScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getRouteParamId(id);
  const { historicalWorkout, exerciseRows, isLoading } =
    useHistoricalWorkoutDraftScreen(workoutId);
  const { saveDraft, discardDraft } = useHistoricalWorkoutDraftActions();

  const leaveDraft = useCallback(() => {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace('/(tabs)/log');
  }, []);

  const discardHistoricalWorkout = useCallback(
    (hasExercisesLogged: boolean) => {
      if (!historicalWorkout) {
        leaveDraft();

        return;
      }

      const discard = () => {
        discardDraft(historicalWorkout.id);
        leaveDraft();
      };

      if (!hasExercisesLogged) {
        discard();

        return;
      }

      Alert.alert(
        'Discard workout?',
        `"${historicalWorkout.name}" and its logged exercises and sets will be removed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: discard
          }
        ]
      );
    },
    [discardDraft, historicalWorkout, leaveDraft]
  );

  const saveHistoricalWorkout = useCallback(() => {
    if (!historicalWorkout) {
      return;
    }

    try {
      const savedWorkout = saveDraft(historicalWorkout.id);

      if (!savedWorkout) {
        Alert.alert(
          'Add a set first',
          'Log at least one completed set before saving this workout.'
        );

        return;
      }

      router.replace({
        pathname: '/workouts/[id]',
        params: { id: savedWorkout.id }
      });
    } catch (error) {
      console.error('Failed to save historical workout', error);
      Alert.alert('Could not save workout', 'Please try again.');
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
      exerciseRows={exerciseRows}
      mode="historical"
      onDiscardHistoricalWorkout={discardHistoricalWorkout}
      onSaveHistoricalWorkout={saveHistoricalWorkout}
    />
  );
}

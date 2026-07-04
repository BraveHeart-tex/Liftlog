import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { ActiveWorkoutContent } from '@/src/features/workouts/components/active-workout-content';
import {
  useHistoricalWorkoutEditActions,
  useHistoricalWorkoutEditScreen
} from '@/src/features/workouts/hooks';
import { getRouteParamId } from '@/src/lib/utils/route';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export default function HistoricalWorkoutEditScreen() {
  const { id, sourceWorkoutId: rawSourceWorkoutId } = useLocalSearchParams<{
    id?: string | string[];
    sourceWorkoutId?: string | string[];
  }>();
  const draftWorkoutId = getRouteParamId(id);
  const sourceWorkoutId = getRouteParamId(rawSourceWorkoutId);
  const { draftWorkout, sourceWorkout, exerciseRows, isLoading } =
    useHistoricalWorkoutEditScreen({ draftWorkoutId, sourceWorkoutId });
  const { saveDraft, discardDraft } = useHistoricalWorkoutEditActions();

  const leaveDraft = useCallback(() => {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace('/(tabs)/log');
  }, []);

  const discardEditDraft = useCallback(
    (hasExercisesLogged: boolean) => {
      if (!draftWorkout) {
        leaveDraft();

        return;
      }

      const discard = () => {
        discardDraft(draftWorkout.id);
        leaveDraft();
      };

      if (!hasExercisesLogged) {
        discard();

        return;
      }

      Alert.alert(
        'Discard changes?',
        `Your edits to "${draftWorkout.name}" will be removed.`,
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
    [discardDraft, draftWorkout, leaveDraft]
  );

  const saveEditDraft = useCallback(() => {
    if (!draftWorkout || !sourceWorkout) {
      return;
    }

    try {
      const savedWorkout = saveDraft({
        sourceWorkoutId: sourceWorkout.id,
        draftWorkoutId: draftWorkout.id
      });

      if (!savedWorkout) {
        Alert.alert(
          'Add a set first',
          'Log at least one completed set before saving these edits.'
        );

        return;
      }

      router.replace({
        pathname: '/workouts/[id]',
        params: { id: savedWorkout.id }
      });
    } catch (error) {
      console.error('Failed to save workout edits', error);
      Alert.alert('Could not save edits', 'Please try again.');
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
        <EmptyState
          title="Workout not found"
          description="This edit draft may have already been saved or discarded."
          action={
            <Button onPress={() => router.replace('/(tabs)/log')}>
              Go back
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <ActiveWorkoutContent
      activeWorkout={draftWorkout}
      exerciseRows={exerciseRows}
      mode="historical-edit"
      onDiscardHistoricalWorkout={discardEditDraft}
      onSaveHistoricalWorkout={saveEditDraft}
    />
  );
}

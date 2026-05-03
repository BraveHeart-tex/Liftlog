import { StyledTextInput } from '@/src/components/styled/text-input';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import {
  useRepeatWorkout,
  useWorkoutDelete,
  useWorkoutHistoryDetail,
  useWorkoutRename
} from '@/src/features/workouts/hooks';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { getRouteParamId } from '@/src/lib/utils/route';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { router, useLocalSearchParams } from 'expo-router';
import { Trash2Icon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, View, type TextInput } from 'react-native';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getRouteParamId(id);
  const renameInputRef = useRef<TextInput>(null);
  const isSavingRenameRef = useRef(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [renameError, setRenameError] = useState<string | undefined>();
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const {
    workout,
    activeWorkout,
    workoutExerciseRows,
    exerciseById,
    setsByWorkoutExerciseId,
    totalVolume,
    totalCompletedSets,
    weightUnit,
    isLoading,
    canRepeatWorkout
  } = useWorkoutHistoryDetail(workoutId);
  const renameWorkout = useWorkoutRename();
  const deleteWorkout = useWorkoutDelete();
  const repeatWorkout = useRepeatWorkout({
    workout,
    activeWorkout,
    workoutExerciseRows,
    canRepeatWorkout
  });

  useEffect(() => {
    if (!isRenaming || !workout) {
      return;
    }

    setDraftName(workout.name);
    setRenameError(undefined);
    const focusTimer = setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.setSelection(0, workout.name.length);
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [isRenaming, workout]);

  if (workoutId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading workout..." />
      </Screen>
    );
  }

  if (!workout) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Workout not found
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          This workout may have been deleted.
        </Text>
      </Screen>
    );
  }

  const beginRename = () => {
    if (isRenaming) {
      return;
    }

    setDraftName(workout.name);
    setRenameError(undefined);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    Keyboard.dismiss();
    isSavingRenameRef.current = false;
    setDraftName(workout.name);
    setRenameError(undefined);
    setIsSavingRename(false);
    setIsRenaming(false);
  };

  const confirmDeleteWorkout = () => {
    Alert.alert(
      'Delete workout?',
      `${workout.name} and its logged sets will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              const didDelete = deleteWorkout(workout.id);

              if (!didDelete) {
                Alert.alert(
                  'Workout not found',
                  'This workout may have already been deleted.'
                );

                return;
              }

              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/history');
              }
            } catch (error) {
              console.error('Failed to delete workout', error);
              Alert.alert('Could not delete workout', 'Please try again.');
            }
          }
        }
      ]
    );
  };

  const submitRename = () => {
    if (isSavingRenameRef.current) {
      return;
    }

    isSavingRenameRef.current = true;
    setIsSavingRename(true);
    setRenameError(undefined);

    try {
      const updatedWorkout = renameWorkout(workout, draftName);

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
    <Screen scroll>
      <View className="flex-row items-center gap-3">
        <BackButton onPress={isRenaming ? cancelRename : undefined} />
        <View className="flex-1">
          {isRenaming ? (
            <StyledTextInput
              ref={renameInputRef}
              className="text-h1 text-foreground border-border rounded-md border-b py-1"
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
              <Text variant="h1" numberOfLines={2}>
                {workout.name}
              </Text>
            </Pressable>
          )}
          <Text variant="small" tone="muted" className="mt-1">
            {formatWorkoutDate(workout.startedAt, 'full')}
          </Text>
          {renameError ? (
            <Text variant="caption" tone="danger" className="mt-2">
              {renameError}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="mt-6 flex-row gap-3">
        <Card className="flex-1">
          <CardContent>
            <Text variant="caption" tone="muted">
              Duration
            </Text>
            <Text variant="h3" className="mt-1">
              {formatDuration({
                startedAt: workout.startedAt,
                completedAt: workout.completedAt
              })}
            </Text>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent>
            <Text variant="caption" tone="muted">
              Sets
            </Text>
            <Text variant="h3" className="mt-1">
              {totalCompletedSets}
            </Text>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent>
            <Text variant="caption" tone="muted">
              Volume
            </Text>
            <Text variant="h3" className="mt-1">
              {formatWeightForUnit(totalVolume, weightUnit)} {weightUnit}
            </Text>
          </CardContent>
        </Card>
      </View>

      <Button
        variant="secondary"
        className="mt-6 w-full"
        disabled={
          isRenaming || isSavingRename || workoutExerciseRows.length === 0
        }
        onPress={() => setIsTemplateSheetOpen(true)}
      >
        Save as template
      </Button>

      <View className="mt-6">
        <Text variant="caption" tone="muted" className="mb-3">
          Exercises
        </Text>

        {workoutExerciseRows.length === 0 ? (
          <View className="mt-3 items-center py-8">
            <Text variant="small" tone="muted" className="text-center">
              No exercises were logged in this workout.
            </Text>
          </View>
        ) : (
          workoutExerciseRows.map(workoutExercise => {
            const exercise = exerciseById.get(workoutExercise.exerciseId);
            const completedSets =
              setsByWorkoutExerciseId.get(workoutExercise.id) ?? [];

            return (
              <Card key={workoutExercise.id} className="mt-3">
                <CardContent>
                  <Text variant="bodyMedium">
                    {exercise?.name ?? 'Unknown exercise'}
                  </Text>

                  {completedSets.length === 0 ? (
                    <Text variant="small" tone="muted" className="mt-2">
                      No sets logged
                    </Text>
                  ) : (
                    <View className="mt-3">
                      {completedSets.map((set, index) => (
                        <View
                          key={set.id}
                          className="flex-row items-center gap-3 py-1"
                        >
                          <Text variant="caption" tone="muted" className="w-6">
                            {index + 1}
                          </Text>
                          <Text variant="caption">
                            {formatWeightForUnit(set.weightKg, weightUnit)}{' '}
                            {weightUnit}
                          </Text>
                          <Text variant="caption" tone="muted">
                            x
                          </Text>
                          <Text variant="caption">{set.reps} reps</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </View>

      <Button
        variant="secondary"
        className="mt-6 w-full"
        disabled={isRenaming || isSavingRename || !canRepeatWorkout}
        onPress={repeatWorkout}
      >
        {activeWorkout ? 'Resume active workout' : 'Repeat this workout'}
      </Button>

      <Button
        variant="destructive"
        className="mt-3 w-full"
        disabled={isRenaming || isSavingRename}
        leftIcon={
          <Icon
            icon={Trash2Icon}
            size={18}
            className="text-danger-foreground"
          />
        }
        onPress={confirmDeleteWorkout}
      >
        Delete workout
      </Button>

      <SaveWorkoutTemplateSheet
        isOpen={isTemplateSheetOpen}
        initialName={workout.name}
        workoutExerciseRows={workoutExerciseRows.map(workoutExercise => ({
          exerciseId: workoutExercise.exerciseId,
          order: workoutExercise.order
        }))}
        onClose={() => setIsTemplateSheetOpen(false)}
      />
    </Screen>
  );
}

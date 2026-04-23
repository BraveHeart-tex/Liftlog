import { useDrizzle } from '@/src/components/database-provider';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { StyledTextInput } from '@/src/components/styled/text-input';
import { useExerciseDetail } from '@/src/features/exercises/hooks';
import {
  removeCustomExercise,
  updateCustomExerciseName
} from '@/src/features/exercises/repository';
import { cn } from '@/src/lib/utils/cn';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { formatMuscleList } from '@/src/lib/utils/muscle';
import { getRouteParamId } from '@/src/lib/utils/route';
import { toTitleCase } from '@/src/lib/utils/string';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, View } from 'react-native';
import type { TextInput } from 'react-native';

export default function ExerciseDetailScreen() {
  const db = useDrizzle();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const exerciseId = getRouteParamId(id);
  const renameInputRef = useRef<TextInput>(null);
  const isSavingRenameRef = useRef(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [renameError, setRenameError] = useState<string | undefined>();
  const [isSavingRename, setIsSavingRename] = useState(false);
  const {
    exercise,
    exercises,
    exerciseUsageCount,
    history,
    prRows,
    primaryMuscles,
    secondaryMuscles,
    instructions,
    mostRecentHistory,
    completedSetSummary,
    weightUnit,
    isLoading
  } = useExerciseDetail(exerciseId);

  useEffect(() => {
    if (!isRenaming || !exercise) {
      return;
    }

    setDraftName(exercise.name);
    setRenameError(undefined);
    const focusTimer = setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.setSelection(0, exercise.name.length);
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [exercise, isRenaming]);

  if (exerciseId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading exercise..." />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Exercise not found
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          The exercise you&apos;re looking for doesn&apos;t exist.
        </Text>
      </Screen>
    );
  }

  const isCustomExercise = exercise.isCustom === 1;
  const usageLabel =
    exerciseUsageCount === 1
      ? '1 workout entry'
      : `${exerciseUsageCount} workout entries`;
  const removeActionLabel = exerciseUsageCount > 0 ? 'Archive' : 'Delete';
  const trimmedDraftName = draftName.trim();
  const hasRenameChanged = trimmedDraftName !== exercise.name.trim();
  const hasDuplicateName = exercises.some(
    exerciseRow =>
      exerciseRow.id !== exercise.id &&
      exerciseRow.name.trim().toLocaleLowerCase() ===
        trimmedDraftName.toLocaleLowerCase()
  );
  const canSaveRename =
    trimmedDraftName.length > 0 && hasRenameChanged && !isSavingRename;

  const beginRename = () => {
    if (!isCustomExercise || isRenaming) {
      return;
    }

    setDraftName(exercise.name);
    setRenameError(undefined);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    Keyboard.dismiss();
    isSavingRenameRef.current = false;
    setDraftName(exercise.name);
    setRenameError(undefined);
    setIsSavingRename(false);
    setIsRenaming(false);
  };

  const submitRename = async () => {
    if (!canSaveRename || isSavingRenameRef.current) {
      return;
    }

    if (hasDuplicateName) {
      setRenameError('An exercise with this name already exists.');

      return;
    }

    isSavingRenameRef.current = true;
    setIsSavingRename(true);
    setRenameError(undefined);

    try {
      const updatedExercise = updateCustomExerciseName(
        db,
        exercise.id,
        trimmedDraftName
      );

      if (!updatedExercise) {
        setRenameError('Only custom exercises can be renamed.');
        isSavingRenameRef.current = false;
        setIsSavingRename(false);

        return;
      }
    } catch (error) {
      console.error('Failed to rename custom exercise', error);
      setRenameError('Could not rename exercise. Try again.');
      isSavingRenameRef.current = false;
      setIsSavingRename(false);

      return;
    }

    Keyboard.dismiss();
    isSavingRenameRef.current = false;
    setIsSavingRename(false);
    setIsRenaming(false);
  };

  const handleRemoveCustomExercise = () => {
    if (!isCustomExercise || isRenaming) {
      return;
    }

    const title =
      exerciseUsageCount > 0 ? 'Archive exercise?' : 'Delete exercise?';
    const message =
      exerciseUsageCount > 0
        ? `${exercise.name} is used in ${usageLabel}. It will be hidden from new workouts, but your history stays intact.`
        : `${exercise.name} has no workout history and will be permanently deleted.`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: removeActionLabel,
        style: 'destructive',
        onPress: () => {
          let result: ReturnType<typeof removeCustomExercise>;

          try {
            result = removeCustomExercise(db, exercise.id);
          } catch (error) {
            console.error('Failed to remove custom exercise', error);
            Alert.alert(
              'Exercise was not changed',
              'Could not update this exercise. Try again.'
            );

            return;
          }

          if (result === 'archived' || result === 'deleted') {
            router.replace('/(tabs)/exercises');

            return;
          }

          Alert.alert(
            'Exercise was not changed',
            'Only custom exercises can be archived or deleted.'
          );
        }
      }
    ]);
  };

  return (
    <>
      <Screen scroll>
        <View>
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
                  accessibilityLabel="Exercise name"
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
                  accessibilityRole={isCustomExercise ? 'button' : undefined}
                  accessibilityLabel={
                    isCustomExercise ? 'Rename exercise' : undefined
                  }
                  disabled={!isCustomExercise}
                  onPress={beginRename}
                >
                  <Text variant="h1" numberOfLines={2} ellipsizeMode="tail">
                    {exercise.name}
                  </Text>
                </Pressable>
              )}
              <Text variant="small" tone="muted">
                {toTitleCase(exercise.category)}
              </Text>
              {renameError ? (
                <Text variant="caption" tone="danger" className="mt-2">
                  {renameError}
                </Text>
              ) : null}
              {isRenaming ? (
                <View className="mt-3 flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      accessibilityLabel="Cancel rename"
                      onPress={cancelRename}
                      disabled={isSavingRename}
                    >
                      Cancel
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      size="sm"
                      accessibilityLabel="Save exercise name"
                      onPress={submitRename}
                      disabled={!canSaveRename}
                      loading={isSavingRename}
                    >
                      Save
                    </Button>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {isCustomExercise ? (
          <Card className="mt-6">
            <CardContent>
              <Text variant="caption" tone="muted">
                Custom exercise
              </Text>

              <Text variant="small" tone="muted" className="mt-3">
                {exerciseUsageCount > 0
                  ? `Used in ${usageLabel}. Archive keeps workout history safe.`
                  : 'Not used in any workouts yet. You can delete it permanently.'}
              </Text>

              <View className="mt-4 flex-row gap-3">
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    accessibilityLabel="Rename exercise"
                    onPress={beginRename}
                    disabled={isRenaming}
                  >
                    Rename
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    variant="destructive"
                    onPress={handleRemoveCustomExercise}
                    disabled={isRenaming}
                  >
                    {removeActionLabel}
                  </Button>
                </View>
              </View>
            </CardContent>
          </Card>
        ) : null}

        <Card className={isCustomExercise ? 'mt-4' : 'mt-6'}>
          <CardContent>
            <Text variant="caption" tone="muted">
              Muscle groups
            </Text>

            <View className="mt-4">
              <Text variant="small" tone="muted">
                Primary
              </Text>
              <Text variant="body" className="mt-1">
                {formatMuscleList(primaryMuscles)}
              </Text>
            </View>

            {secondaryMuscles.length > 0 ? (
              <View className="mt-4">
                <Text variant="small" tone="muted">
                  Secondary
                </Text>
                <Text variant="body" className="mt-1">
                  {formatMuscleList(secondaryMuscles)}
                </Text>
              </View>
            ) : null}
          </CardContent>
        </Card>

        {instructions ? (
          <Card className="mt-4">
            <CardContent>
              <Text variant="caption" tone="muted">
                Instructions
              </Text>
              <Text variant="body" className="mt-4">
                {instructions}
              </Text>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-4">
          <CardContent>
            <Text variant="caption" tone="muted">
              Last performed
            </Text>

            {mostRecentHistory && completedSetSummary ? (
              <View className="mt-4">
                <Text variant="h3">{completedSetSummary}</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  {formatWorkoutDate(mostRecentHistory.workout.startedAt)}
                </Text>
              </View>
            ) : (
              <View className="mt-4">
                <Text variant="h3">No history yet</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Log a workout to see stats
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <Text variant="caption" tone="muted">
              History
            </Text>

            {history.length === 0 ? (
              <View className="mt-4">
                <Text variant="h3">No history yet</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Log a workout to see your history here.
                </Text>
              </View>
            ) : (
              history.map((historyEntry, historyIndex) => {
                return (
                  <View key={historyEntry.workout.id}>
                    <Text variant="caption" tone="muted" className="mt-4 mb-2">
                      {formatWorkoutDate(historyEntry.workout.startedAt)} ·{' '}
                      {historyEntry.sets.length} sets
                    </Text>

                    {historyEntry.sets.map((set, index) => {
                      const isBestSet = set.id === historyEntry.bestSetId;

                      return (
                        <View
                          key={set.id}
                          className={cn(
                            'flex-row items-center gap-3 py-1',
                            isBestSet && 'bg-success/10 rounded-md'
                          )}
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
                          <View className="ml-1 w-10">
                            {isBestSet ? (
                              <Text variant="caption" className="text-success">
                                Best
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}

                    {historyIndex < history.length - 1 && (
                      <View className="border-border mt-4 border-b" />
                    )}
                  </View>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <Text variant="caption" tone="muted">
              Personal records
            </Text>

            {prRows.length === 0 ? (
              <View className="mt-4">
                <Text variant="h3">No PRs yet</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Beat your best estimated 1RM to set a PR.
                </Text>
              </View>
            ) : (
              <View className="mt-4">
                {prRows.map((pr, index) => (
                  <View
                    key={pr.id}
                    className={cn(
                      'flex-row items-center justify-between py-3',
                      index < prRows.length - 1 && 'border-border border-b'
                    )}
                  >
                    <View className="flex-1">
                      <Text variant="bodyMedium">
                        {formatWeightForUnit(pr.weightKg, weightUnit)}{' '}
                        {weightUnit} x {pr.reps}
                      </Text>
                      <Text variant="caption" tone="muted" className="mt-1">
                        {formatWorkoutDate(pr.achievedAt)}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text variant="caption" tone="muted">
                        Est. 1RM
                      </Text>
                      <Text variant="bodyMedium" className="mt-1">
                        {formatWeightForUnit(pr.estimated1rm, weightUnit)}{' '}
                        {weightUnit}
                      </Text>
                    </View>

                    <View className="ml-3 w-12 items-end">
                      {index === 0 ? (
                        <View className="bg-success/15 rounded-md px-2 py-1">
                          <Text variant="caption" className="text-success">
                            Best
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </Screen>
    </>
  );
}

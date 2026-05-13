import { StyledTextInput } from '@/src/components/styled/text-input';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseDetailActionsSheet } from '@/src/features/exercises/components/exercise-detail-actions-sheet';
import { ExerciseProgressChart } from '@/src/features/exercises/components/exercise-progress-chart';
import {
  useExerciseActions,
  useExerciseDetail,
  type ExercisePersonalRecordSummaryItem
} from '@/src/features/exercises/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { formatMuscleList } from '@/src/lib/utils/muscle';
import { getRouteParamId } from '@/src/lib/utils/route';
import { toTitleCase } from '@/src/lib/utils/string';
import { formatWeightForUnit, type WeightUnit } from '@/src/lib/utils/weight';
import { router, useLocalSearchParams } from 'expo-router';
import { EllipsisVerticalIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { Alert, Keyboard, View } from 'react-native';

function formatUsageBreakdown({
  workoutUsageCount,
  templateUsageCount
}: {
  workoutUsageCount: number;
  templateUsageCount: number;
}) {
  const parts: string[] = [];

  if (workoutUsageCount > 0) {
    parts.push(
      workoutUsageCount === 1
        ? '1 workout entry'
        : `${workoutUsageCount} workout entries`
    );
  }

  if (templateUsageCount > 0) {
    parts.push(
      templateUsageCount === 1
        ? '1 template'
        : `${templateUsageCount} templates`
    );
  }

  if (parts.length === 0) {
    return 'no workouts or templates';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} and ${parts[1]}`;
}

function formatRecordValue(
  record: ExercisePersonalRecordSummaryItem,
  weightUnit: WeightUnit
) {
  if (record.id === 'best-set' && record.weightKg !== undefined) {
    return `${formatWeightForUnit(record.weightKg, weightUnit)} ${weightUnit} x ${
      record.reps ?? 0
    }`;
  }

  if (record.id === 'heaviest-weight' && record.weightKg !== undefined) {
    return `${formatWeightForUnit(record.weightKg, weightUnit)} ${weightUnit}`;
  }

  return record.count === 1 ? '1 set' : `${record.count ?? 0} sets`;
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const exerciseId = getRouteParamId(id);
  const renameInputRef = useRef<TextInput>(null);
  const isSavingRenameRef = useRef(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [renameError, setRenameError] = useState<string | undefined>();
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const {
    exercise,
    exercises,
    exerciseUsageCount,
    workoutUsageCount,
    templateUsageCount,
    history,
    progressPoints,
    personalRecordsSummary,
    topSetPerformances,
    primaryMuscles,
    secondaryMuscles,
    weightUnit,
    isLoading
  } = useExerciseDetail(exerciseId);
  const { renameCustomExercise, removeCustomExerciseById } =
    useExerciseActions();

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
  const usageLabel = formatUsageBreakdown({
    workoutUsageCount,
    templateUsageCount
  });
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
      const updatedExercise = renameCustomExercise(
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
        ? `${exercise.name} is used in ${usageLabel}. It will be hidden from new workouts and templates, but your existing history stays intact.`
        : `${exercise.name} is not used in any workouts or templates and will be permanently deleted.`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: removeActionLabel,
        style: 'destructive',
        onPress: () => {
          let result: ReturnType<typeof removeCustomExerciseById>;

          try {
            result = removeCustomExerciseById(exercise.id);
          } catch (error) {
            console.error('Failed to remove custom exercise', error);
            Alert.alert(
              'Exercise was not changed',
              'Could not update this exercise. Try again.'
            );

            return;
          }

          if (result === 'archived' || result === 'deleted') {
            router.back();

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

  const handleEditDetails = () => {
    if (!isCustomExercise || isRenaming) {
      return;
    }

    router.push({
      pathname: '/exercises/edit/[id]',
      params: { id: exercise.id }
    });
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
                <Text variant="h1" numberOfLines={2} ellipsizeMode="tail">
                  {exercise.name}
                </Text>
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

            {isCustomExercise && !isRenaming ? (
              <Button
                variant="ghost"
                size="icon"
                accessibilityLabel="Exercise actions"
                onPress={() => setIsActionsOpen(true)}
              >
                <Icon
                  icon={EllipsisVerticalIcon}
                  size={20}
                  className="text-foreground"
                />
              </Button>
            ) : null}
          </View>
        </View>

        <ExerciseProgressChart
          points={progressPoints}
          weightUnit={weightUnit}
        />

        <Card className="mt-4">
          <CardContent>
            <Text variant="caption" tone="muted">
              Personal records
            </Text>

            {personalRecordsSummary.length === 0 ? (
              <View className="mt-4">
                <Text variant="h3">No records yet</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Complete sets for this exercise to build your records.
                </Text>
              </View>
            ) : (
              <View className="mt-4">
                {personalRecordsSummary.map((record, index) => (
                  <View
                    key={record.id}
                    className={cn(
                      'flex-row items-center justify-between gap-3 py-3',
                      index < personalRecordsSummary.length - 1 &&
                        'border-border border-b'
                    )}
                  >
                    <View className="flex-1">
                      <Text variant="bodyMedium">
                        {formatRecordValue(record, weightUnit)}
                      </Text>
                      <Text variant="caption" tone="muted" className="mt-1">
                        {record.label}
                      </Text>
                    </View>

                    <Text variant="caption" tone="muted">
                      {formatWorkoutDate(record.achievedAt)}
                    </Text>

                    <View className="w-16 items-end">
                      {record.isNewRecord ? (
                        <View className="bg-success/15 rounded-md px-2 py-1">
                          <Text variant="caption" className="text-success">
                            PR
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

        <Card className="mt-4">
          <CardContent>
            <Text variant="caption" tone="muted">
              Top set performance
            </Text>

            {topSetPerformances.length === 0 ? (
              <View className="mt-4">
                <Text variant="h3">No top sets yet</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Complete a set to see your best performances.
                </Text>
              </View>
            ) : (
              <View className="mt-4">
                {topSetPerformances.map((performance, index) => (
                  <View
                    key={performance.id}
                    className={cn(
                      'flex-row items-center gap-3 py-3',
                      index < topSetPerformances.length - 1 &&
                        'border-border border-b'
                    )}
                  >
                    <View
                      className={cn(
                        'bg-muted h-10 w-10 items-center justify-center rounded-lg',
                        index === 0 && 'bg-primary/15'
                      )}
                    >
                      <Text
                        variant="caption"
                        className={cn(index === 0 && 'text-primary')}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text variant="bodyMedium">
                        {formatWeightForUnit(performance.weightKg, weightUnit)}{' '}
                        {weightUnit} x {performance.reps}
                      </Text>
                      <Text variant="caption" tone="muted" className="mt-1">
                        Est. 1RM{' '}
                        {formatWeightForUnit(
                          performance.estimated1rm,
                          weightUnit
                        )}{' '}
                        {weightUnit} ·{' '}
                        {formatWorkoutDate(performance.achievedAt)}
                      </Text>
                    </View>

                    <View className="w-12 items-end">
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

        <Card className="mt-4">
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
      </Screen>

      <ExerciseDetailActionsSheet
        isOpen={isActionsOpen}
        removeActionLabel={removeActionLabel}
        onClose={() => setIsActionsOpen(false)}
        onRename={beginRename}
        onEditDetails={handleEditDetails}
        onRemove={handleRemoveCustomExercise}
      />
    </>
  );
}

import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { RenameSheet } from '@/src/components/ui/rename-sheet';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseDetailActionsSheet } from '@/src/features/exercises/components/exercise-detail-actions-sheet';
import { ExerciseProgressChart } from '@/src/features/exercises/components/exercise-progress-chart';
import {
  useExerciseActions,
  useExerciseDetail
} from '@/src/features/exercises/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { formatMuscleList } from '@/src/lib/utils/muscle';
import { getRouteParamId } from '@/src/lib/utils/route';
import { toTitleCase } from '@/src/lib/utils/string';
import { router, useLocalSearchParams } from 'expo-router';
import { EllipsisVerticalIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';

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

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const exerciseId = getRouteParamId(id);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const {
    exercise,
    exerciseUsageCount,
    workoutUsageCount,
    templateUsageCount,
    progressPoints,
    personalRecordsSummary,
    topSetPerformances,
    primaryMuscles,
    secondaryMuscles,
    weightUnit,
    trackingType,
    isLoading
  } = useExerciseDetail(exerciseId);
  const {
    hasCustomExerciseNameConflict,
    renameCustomExercise,
    removeCustomExerciseById
  } = useExerciseActions();

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

  const handleRenameExercise = (nextName: string) => {
    if (!isCustomExercise) {
      return 'Only custom exercises can be renamed.';
    }

    if (hasCustomExerciseNameConflict(exercise.id, nextName)) {
      return 'An exercise with this name already exists.';
    }

    try {
      const updatedExercise = renameCustomExercise(exercise.id, nextName);

      if (!updatedExercise) {
        return 'Only custom exercises can be renamed.';
      }
    } catch (error) {
      console.error('Failed to rename custom exercise', error);

      return 'Could not rename exercise. Try again.';
    }

    return undefined;
  };

  const handleRemoveCustomExercise = () => {
    if (!isCustomExercise) {
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
    if (!isCustomExercise) {
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
            <BackButton />
            <View className="flex-1">
              <Text variant="h1" numberOfLines={2} ellipsizeMode="tail">
                {exercise.name}
              </Text>
              <Text variant="small" tone="muted">
                {toTitleCase(exercise.category)}
              </Text>
            </View>

            {isCustomExercise ? (
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
          trackingType={trackingType}
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
                      <Text variant="bodyMedium">{record.value}</Text>
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
                      <Text variant="bodyMedium">{performance.value}</Text>
                      <Text variant="caption" tone="muted" className="mt-1">
                        {performance.scoreLabel} ·{' '}
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
        onRename={() => setIsRenameSheetOpen(true)}
        onEditDetails={handleEditDetails}
        onRemove={handleRemoveCustomExercise}
      />

      <RenameSheet
        isOpen={isRenameSheetOpen}
        title="Rename exercise"
        description="Update the custom exercise name shown in workouts and history."
        inputLabel="Exercise name"
        initialName={exercise.name}
        requiredMessage="Exercise name is required."
        fallbackErrorMessage="Could not rename exercise. Try again."
        onClose={() => setIsRenameSheetOpen(false)}
        onSubmit={handleRenameExercise}
      />
    </>
  );
}

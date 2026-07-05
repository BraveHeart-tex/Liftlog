import { Card, CardContent } from '@/src/components/ui/card';
import { EmptyState } from '@/src/components/ui/empty-state';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseDetailHeader } from '@/src/features/exercises/components/exercise-detail-header';
import { ExerciseProgressChart } from '@/src/features/exercises/components/exercise-progress-chart';
import { useExerciseActions } from '@/src/features/exercises/hooks/use-exercise-actions';
import { useExerciseDetail } from '@/src/features/exercises/hooks/use-exercise-detail';
import { cn } from '@/src/lib/utils/cn.utils';
import { formatWorkoutDate } from '@/src/lib/utils/date.utils';
import { formatMuscleList } from '@/src/features/exercises/muscle.utils';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { toTitleCase } from '@/src/lib/utils/string.utils';
import { router, useLocalSearchParams } from 'expo-router';
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
    isLoading,
    isStatsLoading
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
    <Screen scroll>
      <ExerciseDetailHeader
        name={exercise.name}
        categoryLabel={toTitleCase(exercise.category)}
        isCustomExercise={isCustomExercise}
        removeActionLabel={removeActionLabel}
        onRename={handleRenameExercise}
        onEditDetails={handleEditDetails}
        onRemove={handleRemoveCustomExercise}
      />

      <ExerciseProgressChart
        points={progressPoints}
        weightUnit={weightUnit}
        trackingType={trackingType}
        isLoading={isStatsLoading}
      />

      <Card className="mt-4">
        <CardContent>
          <Text variant="caption" tone="muted">
            Personal records
          </Text>

          {isStatsLoading ? (
            <LoadingState
              label="Loading records..."
              size="small"
              className="min-h-24 py-4"
            />
          ) : personalRecordsSummary.length === 0 ? (
            <EmptyState
              layout="section"
              title="No records yet"
              description="Complete sets for this exercise to build your records."
              className="mt-4 py-0"
            />
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

          {isStatsLoading ? (
            <LoadingState
              label="Loading top sets..."
              size="small"
              className="min-h-24 py-4"
            />
          ) : topSetPerformances.length === 0 ? (
            <EmptyState
              layout="section"
              title="No top sets yet"
              description="Complete a set to see your best performances."
              className="mt-4 py-0"
            />
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
  );
}

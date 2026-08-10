import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { RenameSheet } from '@/src/components/ui/rename-sheet';
import { Screen } from '@/src/components/ui/screen';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { Text } from '@/src/components/ui/text';
import { ExerciseDetailActionsSheet } from '@/src/features/exercises/components/exercise-detail-actions-sheet';
import { ExerciseProgressChart } from '@/src/features/exercises/components/exercise-progress-chart';
import { ExerciseNameConflictError } from '@/src/features/exercises/exercise.repository';
import { useExerciseActions } from '@/src/features/exercises/hooks/use-exercise-actions';
import { useExerciseDetail } from '@/src/features/exercises/hooks/use-exercise-detail';
import { formatMuscleList } from '@/src/features/exercises/muscle.utils';
import { cn } from '@/src/lib/utils/cn.utils';
import { formatWorkoutDate } from '@/src/lib/utils/date.utils';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { triggerHapticWarning } from '@/src/lib/haptics/haptics';
import { toTitleCase } from '@/src/lib/utils/string.utils';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { EllipsisIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

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
    mostRecentHistory,
    completedSetSummary,
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
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const openActions = useCallback(() => setIsActionsOpen(true), []);
  const closeActions = useCallback(() => setIsActionsOpen(false), []);
  const openRenameSheet = useCallback(() => setIsRenameSheetOpen(true), []);
  const closeRenameSheet = useCallback(() => setIsRenameSheetOpen(false), []);

  if (exerciseId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading exercise..." />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen withPadding={false} contentClassName="px-6">
        <EmptyState
          kind="not-found"
          title="Exercise not found"
          description="The exercise you're looking for doesn't exist."
          actions={<BackButton variant="text" />}
        />
      </Screen>
    );
  }

  const isCustomExercise = exercise.isCustom === 1;
  const usageLabel = formatUsageBreakdown({
    workoutUsageCount,
    templateUsageCount
  });
  const removeActionLabel = exerciseUsageCount > 0 ? 'Archive' : 'Delete';
  const strongestSet = topSetPerformances[0];
  const remainingTopPerformances = topSetPerformances.slice(1);
  const bestSetRecord = personalRecordsSummary.find(
    record => record.id === 'best-set'
  );
  const mostSetsRecord = personalRecordsSummary.find(
    record => record.id === 'most-sets'
  );

  const handleRenameExercise = (nextName: string) => {
    if (!isCustomExercise) {
      return 'Only custom exercises can be renamed.';
    }

    if (hasCustomExerciseNameConflict(exercise.id, nextName)) {
      return 'An exercise with this name already exists.';
    }

    try {
      const updatedExercise = renameCustomExercise({
        id: exercise.id,
        name: nextName
      });

      if (!updatedExercise) {
        return 'Only custom exercises can be renamed.';
      }
    } catch (error) {
      if (error instanceof ExerciseNameConflictError) {
        return 'An exercise with this name already exists.';
      }

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

    void confirmDialog({
      title,
      message,
      confirmLabel: removeActionLabel,
      destructive: true
    }).then(confirmed => {
      if (!confirmed) {
        return;
      }

      let result: ReturnType<typeof removeCustomExerciseById>;

      try {
        result = removeCustomExerciseById(exercise.id);
      } catch (error) {
        console.error('Failed to remove custom exercise', error);
        showSnackbar({
          message: 'Could not update this exercise. Try again.',
          variant: 'danger'
        });

        return;
      }

      if (result === 'archived' || result === 'deleted') {
        triggerHapticWarning('custom exercise deletion');
        router.back();

        return;
      }

      showSnackbar({
        message: 'Only custom exercises can be archived or deleted.',
        variant: 'warning'
      });
    });
  };

  const handleEditDetails = () => {
    if (!isCustomExercise) {
      return;
    }

    router.navigate({
      pathname: '/exercises/edit/[id]',
      params: { id: exercise.id }
    });
  };

  return (
    <Screen scroll edges={[]}>
      <Stack.Screen
        options={{
          headerRight: () =>
            isCustomExercise ? (
              <Button
                variant="ghost"
                size="icon"
                accessibilityLabel="Exercise actions"
                onPress={openActions}
              >
                <Icon as={EllipsisIcon} size="lg" tone="foreground" />
              </Button>
            ) : null
        }}
      />

      <View>
        <Text variant="h2">{exercise.name}</Text>
        <Text variant="small" tone="muted" className="mt-1">
          {toTitleCase(exercise.category)}
        </Text>
      </View>

      <ExerciseProgressChart
        points={progressPoints}
        currentPerformance={completedSetSummary}
        currentPerformanceDate={mostRecentHistory?.workout.startedAt}
        weightUnit={weightUnit}
        trackingType={trackingType}
        isLoading={isStatsLoading}
      />

      <View className="border-border mt-6 border-t pt-6">
        <Text variant="bodyMedium">Records</Text>

        {isStatsLoading ? (
          <LoadingState
            label="Loading records..."
            size="small"
            className="min-h-24 py-4"
          />
        ) : !strongestSet || !mostSetsRecord ? (
          <EmptyState
            kind="insufficient-data"
            layout="section"
            title="No records yet"
            description="Complete sets for this exercise to build your records."
            className="mt-4"
          />
        ) : (
          <View className="mt-3">
            <View className="border-border border-b py-3">
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="caption" tone="muted">
                  Strongest set
                </Text>
                {bestSetRecord?.isNewRecord ? (
                  <View className="bg-success/15 rounded-md px-2 py-1">
                    <Text variant="caption" className="text-success">
                      PR
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="bodyMedium" className="mt-1">
                {strongestSet.value}
              </Text>
              <Text variant="caption" tone="muted" className="mt-1">
                {strongestSet.scoreLabel} ·{' '}
                {formatWorkoutDate(strongestSet.achievedAt)}
              </Text>
            </View>

            <View className="border-border border-b py-3">
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="caption" tone="muted">
                  Most sets
                </Text>
                {mostSetsRecord.isNewRecord ? (
                  <View className="bg-success/15 rounded-md px-2 py-1">
                    <Text variant="caption" className="text-success">
                      PR
                    </Text>
                  </View>
                ) : null}
              </View>
              <View className="mt-1 flex-row items-center justify-between gap-4">
                <Text variant="bodyMedium">{mostSetsRecord.value}</Text>
                <Text variant="caption" tone="muted">
                  {formatWorkoutDate(mostSetsRecord.achievedAt)}
                </Text>
              </View>
            </View>

            {remainingTopPerformances.length > 0 ? (
              <View className="pt-4">
                <Text variant="caption" tone="muted">
                  Other top performances
                </Text>

                <View className="mt-1">
                  {remainingTopPerformances.map((performance, index) => (
                    <View
                      key={performance.id}
                      className={cn(
                        'flex-row gap-3 py-3',
                        index < remainingTopPerformances.length - 1 &&
                          'border-border border-b'
                      )}
                    >
                      <Text
                        variant="caption"
                        tone="muted"
                        className="w-5 pt-0.5"
                      >
                        {index + 2}
                      </Text>

                      <View className="flex-1">
                        <Text variant="bodyMedium">{performance.value}</Text>
                        <Text variant="caption" tone="muted" className="mt-1">
                          {performance.scoreLabel} ·{' '}
                          {formatWorkoutDate(performance.achievedAt)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <View className="border-border mt-6 border-t pt-6">
        <Text variant="bodyMedium">Muscle groups</Text>

        <View className="mt-3">
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
      </View>

      {isActionsOpen ? (
        <ExerciseDetailActionsSheet
          isOpen
          removeActionLabel={removeActionLabel}
          onClose={closeActions}
          onRename={openRenameSheet}
          onEditDetails={handleEditDetails}
          onRemove={handleRemoveCustomExercise}
        />
      ) : null}

      {isRenameSheetOpen ? (
        <RenameSheet
          isOpen
          title="Rename exercise"
          description="Update the custom exercise name shown in workouts and history."
          inputLabel="Exercise name"
          initialName={exercise.name}
          requiredMessage="Exercise name is required."
          fallbackErrorMessage="Could not rename exercise. Try again."
          onClose={closeRenameSheet}
          onSubmit={handleRenameExercise}
        />
      ) : null}
    </Screen>
  );
}

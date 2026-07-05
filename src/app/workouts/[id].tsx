import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { RenameSheet } from '@/src/components/ui/rename-sheet';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { resolveTrackingType } from '@/src/features/progress/tracking.domain';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import { WorkoutDetailActionsSheet } from '@/src/features/workouts/components/workout-detail-actions-sheet';
import { WorkoutHistoryExerciseCard } from '@/src/features/workouts/components/workout-history-exercise-card';
import { WorkoutMetricCard } from '@/src/features/workouts/components/workout-metric-card';
import { useHistoricalWorkoutEditStart } from '@/src/features/workouts/hooks/use-historical-workout-edit-start';
import { useRepeatWorkout } from '@/src/features/workouts/hooks/use-repeat-workout';
import { useWorkoutDelete } from '@/src/features/workouts/hooks/use-workout-delete';
import { useWorkoutHistoryDetail } from '@/src/features/workouts/hooks/use-workout-history-detail';
import { useWorkoutRename } from '@/src/features/workouts/hooks/use-workout-rename';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date.utils';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { formatWeightForUnit } from '@/src/lib/utils/weight.utils';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  BookmarkIcon,
  ClockIcon,
  DumbbellIcon,
  EllipsisIcon,
  LayersIcon,
  RepeatIcon
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getRouteParamId(id);

  const detail = useWorkoutHistoryDetail(workoutId);

  if (workoutId && detail.isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading workout..." />
      </Screen>
    );
  }

  if (!detail.workout) {
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

  return <WorkoutDetailLoaded detail={detail} />;
}

interface WorkoutDetailLoadedProps {
  detail: NonNullable<ReturnType<typeof useWorkoutHistoryDetail>> & {
    workout: NonNullable<ReturnType<typeof useWorkoutHistoryDetail>['workout']>;
  };
}

function WorkoutDetailLoaded({ detail }: WorkoutDetailLoadedProps) {
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);

  const {
    workout,
    activeWorkout,
    workoutExerciseRows,
    exerciseById,
    setsByWorkoutExerciseId,
    totalVolume,
    totalCompletedSets,
    weightUnit,
    canRepeatWorkout,
    hasSavedTemplate
  } = detail;
  const renameWorkout = useWorkoutRename();
  const workoutName = workout.name;
  const deleteWorkout = useWorkoutDelete();
  const startWorkoutEdit = useHistoricalWorkoutEditStart();
  const repeatWorkout = useRepeatWorkout({
    workout,
    activeWorkout,
    workoutExerciseRows,
    canRepeatWorkout
  });
  const workoutExerciseRowsForTemplate = useMemo(
    () =>
      workoutExerciseRows.map(workoutExercise => ({
        exerciseId: workoutExercise.exerciseId,
        order: workoutExercise.order
      })),
    [workoutExerciseRows]
  );

  const workoutMetrics = useMemo(() => {
    if (!workout?.startedAt) {
      return [];
    }

    return [
      {
        label: 'Duration',
        value: formatDuration({
          startedAt: workout.startedAt,
          completedAt: workout.completedAt
        }),
        icon: ClockIcon
      },
      {
        label: 'Sets',
        value: totalCompletedSets,
        icon: DumbbellIcon
      },
      {
        label: 'Volume',
        value: `${formatWeightForUnit(totalVolume, weightUnit, {
          useGrouping: true,
          maximumFractionDigits: 0
        })} ${weightUnit}`,
        icon: LayersIcon
      }
    ];
  }, [
    totalCompletedSets,
    totalVolume,
    weightUnit,
    workout.completedAt,
    workout.startedAt
  ]);

  const openActions = useCallback(() => setIsActionSheetOpen(true), []);
  const closeActions = useCallback(() => setIsActionSheetOpen(false), []);
  const openTemplateSheet = useCallback(() => setIsTemplateSheetOpen(true), []);
  const closeTemplateSheet = useCallback(
    () => setIsTemplateSheetOpen(false),
    []
  );
  const openRenameSheet = useCallback(() => setIsRenameSheetOpen(true), []);
  const closeRenameSheet = useCallback(() => setIsRenameSheetOpen(false), []);

  const editWorkout = useCallback(() => {
    try {
      const draftWorkout = startWorkoutEdit(workout.id);

      if (!draftWorkout) {
        Alert.alert(
          'Could not edit workout',
          'This workout may have been deleted.'
        );
      }
    } catch (error) {
      console.error('Failed to start workout edit', error);
      Alert.alert('Could not edit workout', 'Please try again.');
    }
  }, [startWorkoutEdit, workout.id]);

  const confirmDeleteWorkout = useCallback(() => {
    Alert.alert(
      'Delete workout?',
      `${workoutName} and its logged sets will be permanently removed.`,
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
                router.replace('/(tabs)/log');
              }
            } catch (error) {
              console.error('Failed to delete workout', error);
              Alert.alert('Could not delete workout', 'Please try again.');
            }
          }
        }
      ]
    );
  }, [deleteWorkout, workout.id, workoutName]);

  const handleRenameWorkout = useCallback(
    (nextName: string) => {
      try {
        const updatedWorkout = renameWorkout({
          workoutId: workout.id,
          nextName
        });

        if (!updatedWorkout) {
          return 'Could not rename workout. Try again.';
        }
      } catch (error) {
        console.error('Failed to rename workout', error);

        return 'Could not rename workout. Try again.';
      }

      return undefined;
    },
    [renameWorkout, workout.id]
  );

  return (
    <Screen
      scroll
      edges={[]}
      footer={
        <Button
          disabled={!canRepeatWorkout}
          onPress={repeatWorkout}
          leftIcon={
            activeWorkout ? undefined : (
              <Icon as={RepeatIcon} tone="primaryForeground" />
            )
          }
        >
          {activeWorkout ? 'Resume active workout' : 'Repeat this workout'}
        </Button>
      }
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Workout actions"
              onPress={openActions}
            >
              <Icon as={EllipsisIcon} size="lg" tone="foreground" />
            </Button>
          )
        }}
      />

      <View>
        <Text variant="h2">{workoutName}</Text>
        <Text variant="small" tone="muted" className="mt-1">
          {formatWorkoutDate(workout.startedAt, 'full')}
        </Text>
      </View>

      <View className="mt-6 flex-row gap-3">
        {workoutMetrics.map(metric => (
          <WorkoutMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </View>

      {workoutExerciseRows.length > 0 && !hasSavedTemplate && (
        <View className="mt-6">
          <Button
            variant="secondary"
            className="w-full"
            onPress={openTemplateSheet}
            leftIcon={<Icon as={BookmarkIcon} tone="secondaryForeground" />}
          >
            Save as template
          </Button>
        </View>
      )}

      <View className="mt-6">
        <View className="flex-row items-center justify-between">
          <Text variant="caption" tone="muted" className="tracking-widest">
            EXERCISES
          </Text>
          {workoutExerciseRows.length > 0 && (
            <Text variant="caption" tone="muted">
              {workoutExerciseRows.length} total
            </Text>
          )}
        </View>

        {workoutExerciseRows.length === 0 ? (
          <EmptyState
            layout="section"
            title="No exercises were logged in this workout."
            className="mt-3 py-8"
          />
        ) : (
          workoutExerciseRows.map(workoutExercise => {
            const exercise = exerciseById.get(workoutExercise.exerciseId);
            const completedSets =
              setsByWorkoutExerciseId.get(workoutExercise.id) ?? [];

            return (
              <WorkoutHistoryExerciseCard
                key={workoutExercise.id}
                exerciseName={exercise?.name ?? 'Unknown exercise'}
                completedSets={completedSets}
                weightUnit={weightUnit}
                trackingType={resolveTrackingType(exercise?.trackingType)}
              />
            );
          })
        )}
      </View>

      <SaveWorkoutTemplateSheet
        isOpen={isTemplateSheetOpen}
        initialName={workoutName}
        sourceWorkoutId={workout.id}
        workoutExerciseRows={workoutExerciseRowsForTemplate}
        onClose={closeTemplateSheet}
      />

      <WorkoutDetailActionsSheet
        isOpen={isActionSheetOpen}
        onClose={closeActions}
        onEdit={editWorkout}
        onRename={openRenameSheet}
        onDelete={confirmDeleteWorkout}
      />

      <RenameSheet
        isOpen={isRenameSheetOpen}
        title="Rename workout"
        description="Update the name shown in your workout history."
        inputLabel="Workout name"
        initialName={workoutName}
        requiredMessage="Workout name is required."
        fallbackErrorMessage="Could not rename workout. Try again."
        onClose={closeRenameSheet}
        onSubmit={handleRenameWorkout}
      />
    </Screen>
  );
}

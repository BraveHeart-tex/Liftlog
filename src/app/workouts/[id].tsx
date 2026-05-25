import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { RenameSheet } from '@/src/components/ui/rename-sheet';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import { WorkoutDetailActionsSheet } from '@/src/features/workouts/components/workout-detail-actions-sheet';
import { WorkoutDetailHeader } from '@/src/features/workouts/components/workout-detail-header';
import { WorkoutHistoryExerciseCard } from '@/src/features/workouts/components/workout-history-exercise-card';
import { WorkoutMetricCard } from '@/src/features/workouts/components/workout-metric-card';
import { resolveTrackingType } from '@/src/features/progress/tracking';
import {
  useRepeatWorkout,
  useWorkoutDelete,
  useWorkoutHistoryDetail,
  useWorkoutRename
} from '@/src/features/workouts/hooks';
import { formatDuration } from '@/src/lib/utils/date';
import { getRouteParamId } from '@/src/lib/utils/route';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { router, useLocalSearchParams } from 'expo-router';
import {
  BookmarkIcon,
  ClockIcon,
  DumbbellIcon,
  LayersIcon,
  RepeatIcon
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
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
    canRepeatWorkout
  } = detail;
  const renameWorkout = useWorkoutRename();
  const workoutName = workout.name;
  const deleteWorkout = useWorkoutDelete();
  const repeatWorkout = useRepeatWorkout({
    workout,
    activeWorkout,
    workoutExerciseRows,
    canRepeatWorkout
  });

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

  const confirmDeleteWorkout = () => {
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
  };

  const handleRenameWorkout = (nextName: string) => {
    try {
      const updatedWorkout = renameWorkout(workout, nextName);

      if (!updatedWorkout) {
        return 'Could not rename workout. Try again.';
      }
    } catch (error) {
      console.error('Failed to rename workout', error);

      return 'Could not rename workout. Try again.';
    }

    return undefined;
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          disabled={!canRepeatWorkout}
          onPress={repeatWorkout}
          leftIcon={
            activeWorkout ? undefined : (
              <Icon icon={RepeatIcon} className="text-primary-foreground" />
            )
          }
        >
          {activeWorkout ? 'Resume active workout' : 'Repeat this workout'}
        </Button>
      }
    >
      <WorkoutDetailHeader
        name={workoutName}
        startedAt={workout.startedAt}
        onOpenActions={() => setIsActionSheetOpen(true)}
      />

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

      <View className="mt-6">
        <Button
          variant="secondary"
          className="w-full"
          disabled={workoutExerciseRows.length === 0}
          onPress={() => setIsTemplateSheetOpen(true)}
          leftIcon={
            <Icon icon={BookmarkIcon} className="text-secondary-foreground" />
          }
        >
          Save as template
        </Button>
      </View>

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
        workoutExerciseRows={workoutExerciseRows.map(workoutExercise => ({
          exerciseId: workoutExercise.exerciseId,
          order: workoutExercise.order
        }))}
        onClose={() => setIsTemplateSheetOpen(false)}
      />

      <WorkoutDetailActionsSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onRename={() => setIsRenameSheetOpen(true)}
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
        onClose={() => setIsRenameSheetOpen(false)}
        onSubmit={handleRenameWorkout}
      />
    </Screen>
  );
}

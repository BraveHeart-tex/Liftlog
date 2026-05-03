import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import { WorkoutDetailHeader } from '@/src/features/workouts/components/workout-detail-header';
import { WorkoutMetricCard } from '@/src/features/workouts/components/workout-metric-card';
import {
  useRepeatWorkout,
  useWorkoutDelete,
  useWorkoutHistoryDetail,
  useWorkoutRename
} from '@/src/features/workouts/hooks';
import { useWorkoutRenameFlow } from '@/src/features/workouts/hooks/use-workout-rename-flow';
import { formatDuration } from '@/src/lib/utils/date';
import { getRouteParamId } from '@/src/lib/utils/route';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { router, useLocalSearchParams } from 'expo-router';
import {
  BookmarkIcon,
  ClockIcon,
  DumbbellIcon,
  LayersIcon,
  RepeatIcon,
  Trash2Icon
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getRouteParamId(id);

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
  const {
    inputRef: renameInputRef,
    name: workoutName,
    draftName,
    renameError,
    isRenaming,
    isSavingRename,
    beginRename,
    cancelRename,
    setDraftName,
    submitRename
  } = useWorkoutRenameFlow({
    workout,
    renameWorkout
  });
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
    workout?.completedAt,
    workout?.startedAt
  ]);

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

  return (
    <Screen
      scroll
      footer={
        !activeWorkout ? (
          <Button
            disabled={isRenaming || isSavingRename || !canRepeatWorkout}
            onPress={repeatWorkout}
            leftIcon={<Icon icon={RepeatIcon} />}
          >
            Repeat this workout
          </Button>
        ) : undefined
      }
    >
      <WorkoutDetailHeader
        ref={renameInputRef}
        name={workoutName}
        startedAt={workout.startedAt}
        isRenaming={isRenaming}
        draftName={draftName}
        renameError={renameError}
        onBeginRename={beginRename}
        onCancelRename={cancelRename}
        onChangeDraftName={setDraftName}
        onSubmitRename={submitRename}
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

      <View className="mt-6 flex-row items-center gap-2">
        <View className="flex-1">
          <Button
            variant="secondary"
            className="w-full"
            disabled={
              isRenaming || isSavingRename || workoutExerciseRows.length === 0
            }
            onPress={() => setIsTemplateSheetOpen(true)}
            leftIcon={
              <Icon
                icon={BookmarkIcon}
                size={18}
                className="text-secondary-foreground"
              />
            }
          >
            Save as template
          </Button>
        </View>

        <Button
          variant="secondary"
          size="icon"
          disabled={isRenaming || isSavingRename}
          onPress={confirmDeleteWorkout}
        >
          <Icon icon={Trash2Icon} size={18} className="text-danger" />
        </Button>
      </View>

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

      <SaveWorkoutTemplateSheet
        isOpen={isTemplateSheetOpen}
        initialName={workoutName}
        workoutExerciseRows={workoutExerciseRows.map(workoutExercise => ({
          exerciseId: workoutExercise.exerciseId,
          order: workoutExercise.order
        }))}
        onClose={() => setIsTemplateSheetOpen(false)}
      />
    </Screen>
  );
}

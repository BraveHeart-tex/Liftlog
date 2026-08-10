import { StyledFlashList } from '@/src/components/styled/flash-list';
import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { RenameSheet } from '@/src/components/ui/rename-sheet';
import { Screen } from '@/src/components/ui/screen';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { Text } from '@/src/components/ui/text';
import { resolveTrackingType } from '@/src/features/progress/tracking.domain';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/components/save-workout-template-sheet';
import { SupersetIndicator } from '@/src/features/workouts/components/superset-indicator';
import { WorkoutDetailActionsSheet } from '@/src/features/workouts/components/workout-detail-actions-sheet';
import { WorkoutHistoryExerciseCard } from '@/src/features/workouts/components/workout-history-exercise-card';
import { WorkoutMetrics } from '@/src/features/workouts/components/workout-metrics';
import { useHistoricalWorkoutEditStart } from '@/src/features/workouts/hooks/use-historical-workout-edit-start';
import { useRepeatWorkout } from '@/src/features/workouts/hooks/use-repeat-workout';
import { useWorkoutDelete } from '@/src/features/workouts/hooks/use-workout-delete';
import { useWorkoutHistoryDetail } from '@/src/features/workouts/hooks/use-workout-history-detail';
import { useWorkoutRename } from '@/src/features/workouts/hooks/use-workout-rename';
import {
  formatSupersetLabel,
  groupSupersetBlocks
} from '@/src/features/workouts/superset.utils';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date.utils';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { formatWeightForUnit } from '@/src/lib/utils/weight.utils';
import { triggerHapticWarning } from '@/src/lib/haptics/haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  BookmarkIcon,
  ClockIcon,
  DumbbellIcon,
  EllipsisIcon,
  LayersIcon,
  PlayIcon,
  RepeatIcon
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

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

  return (
    <WorkoutDetailLoaded detail={{ ...detail, workout: detail.workout }} />
  );
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
        order: workoutExercise.order,
        supersetId: workoutExercise.supersetId
      })),
    [workoutExerciseRows]
  );
  const supersetBlocks = useMemo(() => {
    return groupSupersetBlocks(workoutExerciseRows);
  }, [workoutExerciseRows]);
  const supersetLabelByBlockId = useMemo(() => {
    let supersetIndex = 0;

    return new Map(
      supersetBlocks
        .filter(block => block.supersetId)
        .map(block => [block.id, formatSupersetLabel(supersetIndex++)])
    );
  }, [supersetBlocks]);

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
        showSnackbar({
          message: 'This workout may have been deleted.',
          variant: 'warning'
        });
      }
    } catch (error) {
      console.error('Failed to start workout edit', error);
      showSnackbar({
        message: 'Could not edit workout. Please try again.',
        variant: 'danger'
      });
    }
  }, [startWorkoutEdit, workout.id]);

  const confirmDeleteWorkout = useCallback(() => {
    void confirmDialog({
      title: 'Delete workout?',
      message: `${workoutName} and its logged sets will be permanently removed.`,
      confirmLabel: 'Delete',
      destructive: true
    }).then(confirmed => {
      if (!confirmed) {
        return;
      }

      try {
        const didDelete = deleteWorkout(workout.id);

        if (!didDelete) {
          showSnackbar({
            message: 'This workout may have already been deleted.',
            variant: 'warning'
          });

          return;
        }

        triggerHapticWarning('completed workout deletion');

        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/log');
        }
      } catch (error) {
        console.error('Failed to delete workout', error);
        showSnackbar({
          message: 'Could not delete workout. Please try again.',
          variant: 'danger'
        });
      }
    });
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

  const historyHeader = useMemo(
    () => (
      <View>
        <View>
          <Text variant="h2">{workoutName}</Text>
          <Text variant="small" tone="muted" className="mt-1">
            {formatWorkoutDate(workout.startedAt, 'full')}
          </Text>
        </View>

        <View className="mt-6">
          <WorkoutMetrics metrics={workoutMetrics} />
        </View>

        {workoutExerciseRows.length > 0 && !hasSavedTemplate && (
          <View className="mt-6">
            <Button
              variant="secondary"
              fullWidth
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
          ) : null}
        </View>
      </View>
    ),
    [
      hasSavedTemplate,
      openTemplateSheet,
      workoutExerciseRows.length,
      workoutMetrics,
      workoutName,
      workout.startedAt
    ]
  );

  const renderHistoryBlock = useCallback(
    ({ item: block }: { item: (typeof supersetBlocks)[number] }) => {
      const renderExerciseCard = (
        workoutExercise: (typeof workoutExerciseRows)[number],
        className?: string
      ) => {
        const exercise = exerciseById.get(workoutExercise.exerciseId);
        const completedSets =
          setsByWorkoutExerciseId.get(workoutExercise.id) ?? [];

        return (
          <WorkoutHistoryExerciseCard
            key={workoutExercise.id}
            exerciseName={exercise?.name ?? 'Unknown exercise'}
            supersetLabel={
              block.supersetId
                ? supersetLabelByBlockId.get(block.id)
                : undefined
            }
            completedSets={completedSets}
            weightUnit={weightUnit}
            trackingType={resolveTrackingType(exercise?.trackingType)}
            className={className}
          />
        );
      };

      if (!block.supersetId) {
        return renderExerciseCard(block.rows[0]);
      }

      return (
        <View className="mt-3">
          {renderExerciseCard(block.rows[0], 'mt-0')}
          <SupersetIndicator />
          {renderExerciseCard(block.rows[1], 'mt-0')}
        </View>
      );
    },
    [exerciseById, setsByWorkoutExerciseId, supersetLabelByBlockId, weightUnit]
  );

  return (
    <Screen
      withPadding={false}
      edges={[]}
      footer={
        <Button
          disabled={!canRepeatWorkout}
          onPress={repeatWorkout}
          leftIcon={
            <Icon
              as={activeWorkout ? PlayIcon : RepeatIcon}
              tone="primaryForeground"
            />
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
      <StyledFlashList
        data={supersetBlocks}
        renderItem={renderHistoryBlock}
        keyExtractor={block => block.id}
        className="flex-1"
        contentContainerClassName="px-4 pb-6 pt-6"
        ListHeaderComponent={historyHeader}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {isTemplateSheetOpen ? (
        <SaveWorkoutTemplateSheet
          isOpen
          initialName={workoutName}
          sourceWorkoutId={workout.id}
          workoutExerciseRows={workoutExerciseRowsForTemplate}
          onClose={closeTemplateSheet}
        />
      ) : null}

      {isActionSheetOpen ? (
        <WorkoutDetailActionsSheet
          isOpen
          onClose={closeActions}
          onEdit={editWorkout}
          onRename={openRenameSheet}
          onDelete={confirmDeleteWorkout}
        />
      ) : null}

      {isRenameSheetOpen ? (
        <RenameSheet
          isOpen
          title="Rename workout"
          description="Update the name shown in your workout history."
          inputLabel="Workout name"
          initialName={workoutName}
          requiredMessage="Workout name is required."
          fallbackErrorMessage="Could not rename workout. Try again."
          onClose={closeRenameSheet}
          onSubmit={handleRenameWorkout}
        />
      ) : null}
    </Screen>
  );
}

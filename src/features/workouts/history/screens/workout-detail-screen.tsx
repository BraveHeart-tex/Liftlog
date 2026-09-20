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
import { useWorkoutDelete } from '@/src/features/workouts/active/hooks/use-workout-delete';
import { useWorkoutRename } from '@/src/features/workouts/active/hooks/use-workout-rename';
import { WorkoutDetailActionsSheet } from '@/src/features/workouts/history/components/workout-detail-actions-sheet';
import { WorkoutHistoryExerciseCard } from '@/src/features/workouts/history/components/workout-history-exercise-card';
import { WorkoutMetrics } from '@/src/features/workouts/history/components/workout-metrics';
import { useHistoricalWorkoutEditStart } from '@/src/features/workouts/history/hooks/use-historical-workout-edit-start';
import { useWorkoutHistoryDetail } from '@/src/features/workouts/history/hooks/use-workout-history-detail';
import { SupersetExerciseGroup } from '@/src/features/workouts/shared/components/superset-exercise-group';
import { SaveWorkoutTemplateSheet } from '@/src/features/workouts/templates/components/save-workout-template-sheet';
import { triggerHapticWarning } from '@/src/lib/haptics/haptics';
import { Stack, router } from 'expo-router';
import {
  BookmarkIcon,
  EllipsisIcon,
  PlayIcon,
  RepeatIcon
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

export function WorkoutDetailScreen({ workoutId }: { workoutId?: string }) {
  const detail = useWorkoutHistoryDetail(workoutId);

  if (workoutId && detail.isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading workout..." />
      </Screen>
    );
  }

  if (!detail.detail) {
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
    <WorkoutDetailLoaded
      detail={detail.detail}
      canRepeatWorkout={detail.canRepeatWorkout}
      hasActiveWorkout={detail.hasActiveWorkout}
      repeatWorkout={detail.repeatWorkout}
    />
  );
}

interface WorkoutDetailLoadedProps {
  detail: NonNullable<ReturnType<typeof useWorkoutHistoryDetail>['detail']>;
  canRepeatWorkout: boolean;
  hasActiveWorkout: boolean;
  repeatWorkout: () => void;
}

function WorkoutDetailLoaded({
  detail,
  canRepeatWorkout,
  hasActiveWorkout,
  repeatWorkout
}: WorkoutDetailLoadedProps) {
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);

  const {
    id: workoutId,
    name: workoutName,
    dateLabel,
    durationLabel,
    setCountLabel,
    volumeLabel,
    exerciseCountLabel,
    exerciseBlocks,
    canSaveAsTemplate,
    repeatButtonLabel,
    templateExerciseRows
  } = detail;
  const renameWorkout = useWorkoutRename();
  const deleteWorkout = useWorkoutDelete();
  const startWorkoutEdit = useHistoricalWorkoutEditStart();

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
      const draftWorkout = startWorkoutEdit(workoutId);

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
  }, [startWorkoutEdit, workoutId]);

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
        const didDelete = deleteWorkout(workoutId);

        if (!didDelete) {
          showSnackbar({
            message: 'This workout may have already been deleted.',
            variant: 'warning'
          });

          return;
        }

        triggerHapticWarning('completed workout deletion');
        showSnackbar({ message: 'Workout deleted.', variant: 'success' });

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
  }, [deleteWorkout, workoutId, workoutName]);

  const handleRenameWorkout = useCallback(
    (nextName: string) => {
      try {
        const updatedWorkout = renameWorkout({
          workoutId,
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
    [renameWorkout, workoutId]
  );

  const historyHeader = useMemo(
    () => (
      <View>
        <View>
          <Text variant="h2">{workoutName}</Text>
          <Text variant="small" tone="muted" className="mt-1">
            {dateLabel}
          </Text>
        </View>

        <View className="mt-6">
          <WorkoutMetrics
            durationLabel={durationLabel}
            setCountLabel={setCountLabel}
            volumeLabel={volumeLabel}
          />
        </View>

        {canSaveAsTemplate && (
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
            {exerciseCountLabel ? (
              <Text variant="caption" tone="muted">
                {exerciseCountLabel}
              </Text>
            ) : null}
          </View>

          {exerciseBlocks.length === 0 ? (
            <EmptyState className="mt-3 py-8">
              <EmptyState.Title variant="bodyMedium">
                No exercises were logged in this workout.
              </EmptyState.Title>
            </EmptyState>
          ) : null}
        </View>
      </View>
    ),
    [
      canSaveAsTemplate,
      dateLabel,
      durationLabel,
      exerciseBlocks.length,
      exerciseCountLabel,
      openTemplateSheet,
      setCountLabel,
      volumeLabel,
      workoutName
    ]
  );

  const renderHistoryBlock = useCallback(
    ({ item: block }: { item: (typeof exerciseBlocks)[number] }) => {
      const renderExerciseCard = (
        exercise: (typeof block.exercises)[number],
        className?: string,
        isGrouped = false
      ) => {
        return (
          <WorkoutHistoryExerciseCard
            key={exercise.id}
            exercise={exercise}
            variant={isGrouped ? 'grouped' : 'default'}
            className={className}
          />
        );
      };

      if (!block.supersetLabel) {
        return renderExerciseCard(block.exercises[0]);
      }

      return (
        <View className="mt-3">
          <SupersetExerciseGroup
            rows={block.exercises}
            supersetLabel={block.supersetLabel}
            renderRow={({ row }) => renderExerciseCard(row, 'mt-0', true)}
          />
        </View>
      );
    },
    []
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
              as={hasActiveWorkout ? PlayIcon : RepeatIcon}
              tone="primaryForeground"
            />
          }
        >
          {repeatButtonLabel}
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
        data={exerciseBlocks}
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
          sourceWorkoutId={workoutId}
          workoutExerciseRows={templateExerciseRows}
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

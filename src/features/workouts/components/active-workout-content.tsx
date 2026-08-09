import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { ActiveWorkoutEditHeader } from '@/src/features/workouts/components/active-workout-edit-header';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { ActiveWorkoutExercisePickerSheet } from '@/src/features/workouts/components/active-workout-exercise-picker-sheet';
import { ActiveWorkoutHeaderWithActions } from '@/src/features/workouts/components/active-workout-header-with-actions';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { HistoricalWorkoutHeader } from '@/src/features/workouts/components/historical-workout-header';
import { RestTimerWidget } from '@/src/features/workouts/components/rest-timer-widget';
import { useActiveWorkoutActions } from '@/src/features/workouts/hooks/use-active-workout-actions';
import { useActiveWorkoutContent as useActiveWorkoutContentData } from '@/src/features/workouts/hooks/use-active-workout-content';
import { useFinishWorkout } from '@/src/features/workouts/hooks/use-finish-workout';
import { useSaveWorkoutExerciseEdits } from '@/src/features/workouts/hooks/use-reorder-workout-exercises';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import { triggerWorkoutEditModeHaptics } from '@/src/features/workouts/workout.haptics';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { router } from 'expo-router';
import { ArrowLeftIcon, CircleCheckBig, PlusIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition
} from 'react-native-reanimated';

const headerEntering = FadeIn.duration(MOTION_DURATION_MS.standard);
const headerExiting = FadeOut.duration(MOTION_DURATION_MS.exit);
const chromeEntering = FadeInDown.duration(MOTION_DURATION_MS.standard);
const chromeExiting = FadeOutDown.duration(MOTION_DURATION_MS.exit);
const chromeLayout = LinearTransition.duration(MOTION_DURATION_MS.standard);

interface ActiveWorkoutContentProps {
  activeWorkout: Workout;
  exerciseRows?: ExerciseListItem[];
  mode?: 'active' | 'historical' | 'historical-edit';
  onDiscardHistoricalWorkout?: (hasWorkoutExercises: boolean) => void;
  onSaveHistoricalWorkout?: () => void;
}

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows,
  mode = 'active',
  onDiscardHistoricalWorkout,
  onSaveHistoricalWorkout
}: ActiveWorkoutContentProps) {
  const [isEditingExercises, setIsEditingExercises] = useState(false);
  const [draftExerciseRows, setDraftExerciseRows] =
    useState<Pick<WorkoutExercise, 'id' | 'supersetId'>[]>();
  const [baselineExerciseRows, setBaselineExerciseRows] =
    useState<Pick<WorkoutExercise, 'id' | 'order' | 'supersetId'>[]>();

  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const [initialCustomExerciseName, setInitialCustomExerciseName] =
    useState('');
  const {
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    workoutExerciseRows,
    setRows,
    completedSetCount,
    isLoadingWorkoutExercises,
    workoutExerciseLoadError,
    exerciseById
  } = useActiveWorkoutContentData({ activeWorkout, exerciseRows });
  const { selectExercise, createAndSelectCustomExercise } =
    useActiveWorkoutActions({
      activeWorkout,
      workoutExerciseRows,
      isLoadingWorkoutExercises,
      setIsExercisePickerOpen
    });
  const saveWorkoutExerciseEdits = useSaveWorkoutExerciseEdits(
    activeWorkout.id
  );
  const finishWorkout = useFinishWorkout();
  const restTimerStatus = useRestTimerStore(state => state.status);

  const workoutName = activeWorkout.name;
  const hasWorkoutExercises = workoutExerciseRows.length > 0;
  const canFinishWorkout = completedSetCount > 0;
  const canSaveHistoricalWorkout = completedSetCount > 0;
  const shouldShowWorkoutChrome =
    !isEditingExercises || (mode === 'active' && restTimerStatus !== 'idle');
  const selectedWorkoutExerciseIds = useMemo(
    () =>
      workoutExerciseRows.map(workoutExercise => workoutExercise.exerciseId),
    [workoutExerciseRows]
  );

  const enterEditMode = useCallback(() => {
    if (isEditingExercises) {
      return;
    }

    if (mode === 'active') {
      triggerWorkoutEditModeHaptics();
      router.navigate('/(tabs)/workout/active/edit-exercises');

      return;
    }

    setDraftExerciseRows(
      workoutExerciseRows.map(workoutExercise => ({
        id: workoutExercise.id,
        supersetId: workoutExercise.supersetId
      }))
    );
    setBaselineExerciseRows(
      workoutExerciseRows.map(workoutExercise => ({
        id: workoutExercise.id,
        order: workoutExercise.order,
        supersetId: workoutExercise.supersetId
      }))
    );
    setIsEditingExercises(true);
  }, [isEditingExercises, mode, workoutExerciseRows]);

  const saveExerciseEdits = useCallback(() => {
    if (!draftExerciseRows || !baselineExerciseRows) {
      setIsEditingExercises(false);

      return;
    }

    try {
      saveWorkoutExerciseEdits(draftExerciseRows, baselineExerciseRows);
      setIsEditingExercises(false);
      setDraftExerciseRows(undefined);
      setBaselineExerciseRows(undefined);
    } catch (error) {
      console.error('Failed to save workout exercise edits', error);
      Alert.alert('Could not save exercise edits', 'Please try again.');
    }
  }, [baselineExerciseRows, draftExerciseRows, saveWorkoutExerciseEdits]);

  const cancelExerciseEdits = useCallback(() => {
    setDraftExerciseRows(undefined);
    setBaselineExerciseRows(undefined);
    setIsEditingExercises(false);
  }, []);

  const openExercisePicker = useCallback(
    () => setIsExercisePickerOpen(true),
    [setIsExercisePickerOpen]
  );

  const confirmFinishWorkout = useCallback(() => {
    Alert.alert(
      'Finish workout?',
      `"${workoutName}" will be saved to your workout history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            finishWorkout(activeWorkout.id);
          }
        }
      ]
    );
  }, [activeWorkout.id, finishWorkout, workoutName]);

  const closeExercisePicker = useCallback(
    () => setIsExercisePickerOpen(false),
    [setIsExercisePickerOpen]
  );

  const openCreateCustomExercise = useCallback(
    (initialName?: string) => {
      Keyboard.dismiss();
      setInitialCustomExerciseName(initialName ?? '');
      setIsExercisePickerOpen(false);
      setIsCreateCustomExerciseOpen(true);
    },
    [setIsExercisePickerOpen]
  );

  const closeCreateCustomExercise = useCallback(
    () => setIsCreateCustomExerciseOpen(false),
    []
  );

  const saveCustomExercise = useCallback(
    (exercise: Parameters<typeof createAndSelectCustomExercise>[0]) => {
      const createdExercise = createAndSelectCustomExercise(exercise);

      if (!createdExercise) {
        return;
      }

      setIsCreateCustomExerciseOpen(false);
    },
    [createAndSelectCustomExercise]
  );

  useEffect(() => {
    if (isEditingExercises && workoutExerciseRows.length === 0) {
      setIsEditingExercises(false);
      setDraftExerciseRows(undefined);
      setBaselineExerciseRows(undefined);
    }
  }, [isEditingExercises, workoutExerciseRows.length]);

  const headerContent = isEditingExercises ? (
    <ActiveWorkoutEditHeader
      workoutName={workoutName}
      onCancel={cancelExerciseEdits}
      onSave={saveExerciseEdits}
    />
  ) : mode === 'historical' || mode === 'historical-edit' ? (
    <HistoricalWorkoutHeader
      title={mode === 'historical-edit' ? 'Edit workout' : 'Log workout'}
      workoutName={workoutName}
      startedAt={activeWorkout.startedAt}
      canSave={canSaveHistoricalWorkout}
      onDiscard={() => onDiscardHistoricalWorkout?.(hasWorkoutExercises)}
      onSave={onSaveHistoricalWorkout ?? (() => undefined)}
    />
  ) : (
    <ActiveWorkoutHeaderWithActions
      workoutName={workoutName}
      workoutId={activeWorkout.id}
      startedAt={activeWorkout.startedAt}
      canSaveTemplate={hasWorkoutExercises}
      exerciseCount={workoutExerciseRows.length}
      completedSetCount={completedSetCount}
      workoutExerciseRows={workoutExerciseRows.map(workoutExercise => ({
        exerciseId: workoutExercise.exerciseId,
        order: workoutExercise.order,
        supersetId: workoutExercise.supersetId
      }))}
    />
  );

  const headerKey = isEditingExercises ? 'edit' : mode;
  const shouldAnimateLocalState = mode !== 'active';

  return (
    <Screen withPadding={false} edges={[]}>
      <Animated.View
        key={headerKey}
        entering={shouldAnimateLocalState ? headerEntering : undefined}
        exiting={shouldAnimateLocalState ? headerExiting : undefined}
      >
        {headerContent}
      </Animated.View>

      {workoutExerciseLoadError ? (
        <View className="flex-1 px-4 pb-6">
          <EmptyState
            title="Could not load exercises"
            description="Something went wrong while loading this workout."
            action={
              <Button
                leftIcon={<Icon as={ArrowLeftIcon} tone="primaryForeground" />}
                onPress={() => router.replace('/(tabs)/workout')}
              >
                Go back
              </Button>
            }
          />
        </View>
      ) : isLoadingWorkoutExercises ? (
        <View className="flex-1 px-4">
          <LoadingState label="Loading exercises..." />
        </View>
      ) : workoutExerciseRows.length > 0 ? (
        <ActiveWorkoutExerciseList
          workoutExercises={workoutExerciseRows}
          sets={setRows}
          exerciseById={exerciseById}
          mode={mode}
          isEditing={isEditingExercises}
          onEnterEditMode={enterEditMode}
          draftExerciseRows={draftExerciseRows}
          onChangeDraftExerciseRows={setDraftExerciseRows}
        />
      ) : (
        <View className="flex-1 px-4 pb-6">
          <EmptyState
            title="No exercises yet"
            description="Add your first exercise to get started."
            action={
              <Button
                leftIcon={<Icon as={PlusIcon} tone="primaryForeground" />}
                onPress={openExercisePicker}
              >
                Add exercise
              </Button>
            }
          />
        </View>
      )}

      {shouldShowWorkoutChrome &&
        !workoutExerciseLoadError &&
        workoutExerciseRows.length > 0 && (
          <Animated.View
            className="border-border bg-background pb-safe border-t px-4 pt-3"
            entering={shouldAnimateLocalState ? chromeEntering : undefined}
            exiting={shouldAnimateLocalState ? chromeExiting : undefined}
            layout={shouldAnimateLocalState ? chromeLayout : undefined}
          >
            {mode === 'active' ? (
              <RestTimerWidget
                className={isEditingExercises ? undefined : 'mb-2'}
              />
            ) : null}

            {!isEditingExercises ? (
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    disabled={isLoadingWorkoutExercises}
                    leftIcon={
                      <Icon as={PlusIcon} size="sm" tone="foreground" />
                    }
                    onPress={openExercisePicker}
                  >
                    Add exercise
                  </Button>
                </View>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canFinishWorkout}
                  leftIcon={
                    <Icon
                      as={CircleCheckBig}
                      size="sm"
                      tone="primaryForeground"
                    />
                  }
                  onPress={confirmFinishWorkout}
                >
                  Finish
                </Button>
              </View>
            ) : null}
          </Animated.View>
        )}

      {isExercisePickerOpen ? (
        <ActiveWorkoutExercisePickerSheet
          isOpen
          exerciseRows={exerciseRows}
          selectedExerciseIds={selectedWorkoutExerciseIds}
          onClose={closeExercisePicker}
          onSelectExercise={selectExercise}
          onCreateCustomExercise={openCreateCustomExercise}
        />
      ) : null}

      {isCreateCustomExerciseOpen ? (
        <CreateCustomExerciseSheet
          isOpen
          initialName={initialCustomExerciseName}
          onClose={closeCreateCustomExercise}
          onSave={saveCustomExercise}
        />
      ) : null}
    </Screen>
  );
}

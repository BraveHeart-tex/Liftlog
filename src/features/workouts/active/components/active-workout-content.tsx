import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { showSnackbar } from '@/src/components/ui/snackbar';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { ActiveWorkoutEditHeader } from '@/src/features/workouts/shared/components/active-workout-edit-header';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/active/components/active-workout-exercise-list';
import { ActiveWorkoutExercisePickerSheet } from '@/src/features/workouts/exercise-selection/components/active-workout-exercise-picker-sheet';
import { ActiveWorkoutHeaderWithActions } from '@/src/features/workouts/active/components/active-workout-header-with-actions';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/exercise-selection/components/create-custom-exercise-sheet';
import { HistoricalWorkoutHeader } from '@/src/features/workouts/active/components/historical-workout-header';
import { useActiveWorkoutActions } from '@/src/features/workouts/active/hooks/use-active-workout-actions';
import { useActiveWorkoutContent as useActiveWorkoutContentData } from '@/src/features/workouts/active/hooks/use-active-workout-content';
import { useFinishWorkout } from '@/src/features/workouts/active/hooks/use-finish-workout';
import { useSaveWorkoutExerciseEdits } from '@/src/features/workouts/active/hooks/use-reorder-workout-exercises';
import { useRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import { triggerWorkoutEditModeHaptics } from '@/src/features/workouts/shared/workout.haptics';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { triggerHapticMedium } from '@/src/lib/haptics/haptics';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { router } from 'expo-router';
import { ArrowLeftIcon, DumbbellIcon, PlusIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
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
  onDiscardHistoricalWorkout?: (
    hasWorkoutExercises: boolean
  ) => boolean | Promise<boolean>;
  onSaveHistoricalWorkout?: () => boolean;
}

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows,
  mode = 'active',
  onDiscardHistoricalWorkout,
  onSaveHistoricalWorkout
}: ActiveWorkoutContentProps) {
  const reduceMotion = useReducedMotion();
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
  const navigation = useNavigation();
  const isConfirmedExitRef = useRef(false);

  const workoutName = activeWorkout.name;
  const hasWorkoutExercises = workoutExerciseRows.length > 0;
  const isHistoricalMode = mode === 'historical' || mode === 'historical-edit';
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

    const hasChanges =
      draftExerciseRows.length !== baselineExerciseRows.length ||
      draftExerciseRows.some((row, order) => {
        const baselineRow = baselineExerciseRows.find(
          baseline => baseline.id === row.id
        );

        return (
          !baselineRow ||
          baselineRow.order !== order ||
          baselineRow.supersetId !== row.supersetId
        );
      });

    try {
      saveWorkoutExerciseEdits(draftExerciseRows, baselineExerciseRows);

      if (hasChanges) {
        triggerHapticMedium('active workout exercise edits');
      }

      setIsEditingExercises(false);
      setDraftExerciseRows(undefined);
      setBaselineExerciseRows(undefined);
    } catch (error) {
      console.error('Failed to save workout exercise edits', error);
      showSnackbar({
        message: 'Could not save exercise edits. Please try again.',
        variant: 'danger'
      });
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
    void confirmDialog({
      title: 'Finish workout?',
      message: `"${workoutName}" will be saved to your workout history.`,
      confirmLabel: 'Finish'
    }).then(confirmed => {
      if (confirmed) {
        finishWorkout(activeWorkout.id);
      }
    });
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

  usePreventRemove(isHistoricalMode, ({ data }) => {
    if (isConfirmedExitRef.current) {
      navigation.dispatch(data.action);

      return;
    }

    if (!onDiscardHistoricalWorkout) {
      navigation.dispatch(data.action);

      return;
    }

    void Promise.resolve(onDiscardHistoricalWorkout(hasWorkoutExercises)).then(
      didDiscard => {
        if (didDiscard) {
          isConfirmedExitRef.current = true;
          navigation.dispatch(data.action);
        }
      }
    );
  });

  const saveHistoricalWorkout = useCallback(() => {
    if (!onSaveHistoricalWorkout) {
      return;
    }

    isConfirmedExitRef.current = true;

    if (!onSaveHistoricalWorkout()) {
      isConfirmedExitRef.current = false;
    }
  }, [onSaveHistoricalWorkout]);

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
      onSave={saveHistoricalWorkout}
    />
  ) : (
    <ActiveWorkoutHeaderWithActions
      workoutName={workoutName}
      workoutId={activeWorkout.id}
      startedAt={activeWorkout.startedAt}
      canSaveTemplate={hasWorkoutExercises}
      exerciseCount={workoutExerciseRows.length}
      completedSetCount={completedSetCount}
      isLoadingWorkoutExercises={isLoadingWorkoutExercises}
      workoutExerciseRows={workoutExerciseRows.map(workoutExercise => ({
        exerciseId: workoutExercise.exerciseId,
        order: workoutExercise.order,
        supersetId: workoutExercise.supersetId
      }))}
    />
  );

  const headerKey = isEditingExercises ? 'edit' : mode;
  const shouldAnimateLocalState = mode !== 'active' && !reduceMotion;
  const workoutChrome =
    shouldShowWorkoutChrome &&
    !workoutExerciseLoadError &&
    workoutExerciseRows.length > 0 ? (
      <Animated.View
        entering={shouldAnimateLocalState ? chromeEntering : undefined}
        exiting={shouldAnimateLocalState ? chromeExiting : undefined}
        layout={shouldAnimateLocalState ? chromeLayout : undefined}
      >
        {!isEditingExercises ? (
          <View className="flex-row items-center gap-2">
            <View className="w-[70%]">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                disabled={isLoadingWorkoutExercises}
                leftIcon={<Icon as={PlusIcon} size="sm" tone="foreground" />}
                onPress={openExercisePicker}
              >
                Add exercise
              </Button>
            </View>

            {mode === 'active' ? (
              <Button
                variant="primary"
                size="sm"
                disabled={!canFinishWorkout}
                onPress={confirmFinishWorkout}
                containerClassName="flex-1"
              >
                Finish
              </Button>
            ) : null}
          </View>
        ) : null}
      </Animated.View>
    ) : null;

  return (
    <Screen withPadding={false} edges={[]} footer={workoutChrome}>
      <Animated.View
        key={headerKey}
        entering={shouldAnimateLocalState ? headerEntering : undefined}
        exiting={shouldAnimateLocalState ? headerExiting : undefined}
      >
        {headerContent}
      </Animated.View>

      {workoutExerciseLoadError ? (
        <View className="flex-1 px-4 pb-6">
          <EmptyState className="flex-1 px-8">
            <EmptyState.Title weight="semiBold">
              Could not load exercises
            </EmptyState.Title>
            <EmptyState.Description>
              Something went wrong while loading this workout.
            </EmptyState.Description>
            <EmptyState.Action>
              <Button
                leftIcon={<Icon as={ArrowLeftIcon} tone="primaryForeground" />}
                onPress={() => router.replace('/(tabs)/workout')}
              >
                Go back
              </Button>
            </EmptyState.Action>
          </EmptyState>
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
          <EmptyState className="flex-1 gap-4 px-8">
            <EmptyState.Icon as={DumbbellIcon} />
            <View className="gap-2">
              <EmptyState.Title weight="semiBold">
                No exercises yet
              </EmptyState.Title>
              <EmptyState.Description>
                Add an exercise to start logging.
              </EmptyState.Description>
            </View>
            <EmptyState.Action>
              <Button
                leftIcon={<Icon as={PlusIcon} tone="primaryForeground" />}
                onPress={openExercisePicker}
                className="w-full"
              >
                Add exercise
              </Button>
            </EmptyState.Action>
          </EmptyState>
        </View>
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

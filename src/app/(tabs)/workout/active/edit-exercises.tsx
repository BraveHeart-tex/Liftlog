import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { showSnackbar } from '@/src/components/ui/snackbar';
import type { Workout } from '@/src/db/schema';
import { ActiveWorkoutEditHeader } from '@/src/features/workouts/components/active-workout-edit-header';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { ActiveWorkoutExercisePickerSheet } from '@/src/features/workouts/components/active-workout-exercise-picker-sheet';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { useActiveWorkoutContent as useActiveWorkoutContentData } from '@/src/features/workouts/hooks/use-active-workout-content';
import { useActiveWorkoutExerciseDraft } from '@/src/features/workouts/hooks/use-active-workout-exercise-draft';
import { useActiveWorkoutScreen } from '@/src/features/workouts/hooks/use-active-workout-screen';
import { triggerHapticMedium } from '@/src/lib/haptics/haptics';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { router } from 'expo-router';
import {
  ArrowLeftIcon,
  ClipboardListIcon,
  PlusIcon
} from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';

export default function ActiveWorkoutEditExercisesScreen() {
  const { activeWorkout, isLoading } = useActiveWorkoutScreen();

  if (isLoading) {
    return (
      <Screen withPadding={false} edges={[]}>
        <LoadingState label="Loading workout..." />
      </Screen>
    );
  }

  if (!activeWorkout) {
    return (
      <Screen withPadding={false} edges={[]} contentClassName="px-6">
        <EmptyState
          title="No active workout"
          action={
            <Button
              leftIcon={<Icon as={ArrowLeftIcon} tone="primaryForeground" />}
              onPress={() => router.replace('/(tabs)/workout')}
            >
              Go back
            </Button>
          }
        />
      </Screen>
    );
  }

  return <ActiveWorkoutEditExercisesContent activeWorkout={activeWorkout} />;
}

interface ActiveWorkoutEditExercisesContentProps {
  activeWorkout: Workout;
}

function ActiveWorkoutEditExercisesContent({
  activeWorkout
}: ActiveWorkoutEditExercisesContentProps) {
  const navigation = useNavigation();
  const isConfirmedExitRef = useRef(false);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const [initialCustomExerciseName, setInitialCustomExerciseName] =
    useState('');
  const {
    workoutExerciseRows,
    setRows,
    isLoadingWorkoutExercises,
    exerciseById
  } = useActiveWorkoutContentData({ activeWorkout });
  const {
    addExercises,
    changeRows,
    draftExerciseById,
    draftWorkoutExercises,
    hasChanges: hasExerciseChanges,
    isInitialized: isDraftInitialized,
    isSaving,
    save,
    selectedExerciseIds,
    stageCustomExercise,
    stagedCustomExerciseNames
  } = useActiveWorkoutExerciseDraft({
    activeWorkout,
    workoutExerciseRows,
    exerciseById,
    isLoadingWorkoutExercises
  });

  const leaveEditScreen = useCallback(() => {
    isConfirmedExitRef.current = true;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/workout/active');
    }
  }, []);

  const confirmDiscardChanges = useCallback((onDiscard: () => void) => {
    void confirmDialog({
      title: 'Discard changes?',
      message: 'Your exercise changes will be lost.',
      confirmLabel: 'Discard',
      destructive: true
    }).then(confirmed => {
      if (confirmed) {
        onDiscard();
      }
    });
  }, []);

  const cancelExerciseEdits = useCallback(() => {
    if (!hasExerciseChanges) {
      leaveEditScreen();

      return;
    }

    confirmDiscardChanges(leaveEditScreen);
  }, [confirmDiscardChanges, hasExerciseChanges, leaveEditScreen]);

  const openExercisePicker = useCallback(
    () => setIsExercisePickerOpen(true),
    []
  );
  const closeExercisePicker = useCallback(
    () => setIsExercisePickerOpen(false),
    []
  );
  const openCreateCustomExercise = useCallback((initialName?: string) => {
    Keyboard.dismiss();
    setInitialCustomExerciseName(initialName ?? '');
    setIsExercisePickerOpen(false);
    setIsCreateCustomExerciseOpen(true);
  }, []);
  const closeCreateCustomExercise = useCallback(
    () => setIsCreateCustomExerciseOpen(false),
    []
  );
  const saveExerciseEdits = useCallback(() => {
    const result = save();

    if (result.status === 'saved') {
      triggerHapticMedium('active workout exercise edits');
      leaveEditScreen();

      return;
    }

    if (result.status === 'unchanged') {
      return;
    }

    isConfirmedExitRef.current = false;
    console.error('Failed to save workout exercise edits', result.error);
    showSnackbar({
      message:
        result.status === 'conflict'
          ? 'The workout or exercise library changed. Your draft was kept; review it and try again.'
          : 'Your draft was kept. Please try again.',
      variant: result.status === 'conflict' ? 'warning' : 'danger'
    });
  }, [leaveEditScreen, save]);

  usePreventRemove(hasExerciseChanges, ({ data }) => {
    if (isConfirmedExitRef.current) {
      navigation.dispatch(data.action);

      return;
    }

    confirmDiscardChanges(() => {
      isConfirmedExitRef.current = true;
      navigation.dispatch(data.action);
    });
  });

  return (
    <Screen withPadding={false} edges={[]}>
      <ActiveWorkoutEditHeader
        workoutName={activeWorkout.name}
        canSave={hasExerciseChanges && !isSaving}
        isSaving={isSaving}
        onCancel={cancelExerciseEdits}
        onSave={saveExerciseEdits}
      />

      {isLoadingWorkoutExercises || !isDraftInitialized ? (
        <View className="flex-1 px-4">
          <LoadingState label="Loading exercises..." />
        </View>
      ) : draftWorkoutExercises.length === 0 ? (
        <View className="flex-1 px-4 pb-6">
          <EmptyState
            layout="section"
            icon={ClipboardListIcon}
            title="No exercises added"
            description="Add exercises to this workout or save it empty."
            action={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Icon as={PlusIcon} size="sm" tone="primary" />}
                onPress={openExercisePicker}
              >
                Add exercise
              </Button>
            }
          />
        </View>
      ) : (
        <>
          <ActiveWorkoutExerciseList
            workoutExercises={draftWorkoutExercises}
            sets={setRows}
            exerciseById={draftExerciseById}
            isEditing
            onChangeDraftExerciseRows={changeRows}
          />
          <View className="border-border pb-safe border-t px-4 pt-3">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<Icon as={PlusIcon} size="sm" tone="foreground" />}
              onPress={openExercisePicker}
            >
              Add exercise
            </Button>
          </View>
        </>
      )}

      {isExercisePickerOpen ? (
        <ActiveWorkoutExercisePickerSheet
          mode="multiple"
          isOpen
          multipleDescription="Choose exercises to add to this workout draft."
          selectedExerciseIds={selectedExerciseIds}
          onClose={closeExercisePicker}
          onSelectExercises={addExercises}
          onCreateCustomExercise={openCreateCustomExercise}
        />
      ) : null}

      {isCreateCustomExerciseOpen ? (
        <CreateCustomExerciseSheet
          isOpen
          initialName={initialCustomExerciseName}
          description="Add it to this draft. It will be created when you save the workout."
          saveLabel="Add to draft"
          reservedNames={stagedCustomExerciseNames}
          onClose={closeCreateCustomExercise}
          onSave={exercise => {
            stageCustomExercise(exercise);
            setIsCreateCustomExerciseOpen(false);
          }}
        />
      ) : null}
    </Screen>
  );
}

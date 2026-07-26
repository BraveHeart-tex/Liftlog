import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import { ActiveWorkoutEditHeader } from '@/src/features/workouts/components/active-workout-edit-header';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { useActiveWorkoutContent as useActiveWorkoutContentData } from '@/src/features/workouts/hooks/use-active-workout-content';
import { useActiveWorkoutScreen } from '@/src/features/workouts/hooks/use-active-workout-screen';
import { useSaveWorkoutExerciseEdits } from '@/src/features/workouts/hooks/use-reorder-workout-exercises';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { router } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

type DraftExerciseRow = Pick<WorkoutExercise, 'id' | 'supersetId'>;

type BaselineExerciseRow = Pick<WorkoutExercise, 'id' | 'order' | 'supersetId'>;

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
  const isSavingRef = useRef(false);
  const isConfirmedExitRef = useRef(false);
  const [draftExerciseRows, setDraftExerciseRows] =
    useState<DraftExerciseRow[]>();
  const [baselineExerciseRows, setBaselineExerciseRows] =
    useState<BaselineExerciseRow[]>();
  const { workoutExerciseRows, isLoadingWorkoutExercises, exerciseById } =
    useActiveWorkoutContentData({ activeWorkout });
  const saveWorkoutExerciseEdits = useSaveWorkoutExerciseEdits(
    activeWorkout.id
  );

  useEffect(() => {
    if (isLoadingWorkoutExercises || baselineExerciseRows) {
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
  }, [baselineExerciseRows, isLoadingWorkoutExercises, workoutExerciseRows]);

  const hasExerciseChanges = useMemo(() => {
    if (!draftExerciseRows || !baselineExerciseRows) {
      return false;
    }

    return (
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
      })
    );
  }, [baselineExerciseRows, draftExerciseRows]);

  const leaveEditScreen = useCallback(() => {
    isConfirmedExitRef.current = true;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/workout/active');
    }
  }, []);

  const confirmDiscardChanges = useCallback((onDiscard: () => void) => {
    Alert.alert('Discard changes?', 'Your exercise changes will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: onDiscard
      }
    ]);
  }, []);

  const cancelExerciseEdits = useCallback(() => {
    if (!hasExerciseChanges) {
      leaveEditScreen();

      return;
    }

    confirmDiscardChanges(leaveEditScreen);
  }, [confirmDiscardChanges, hasExerciseChanges, leaveEditScreen]);

  const saveExerciseEdits = useCallback(() => {
    if (!draftExerciseRows || !baselineExerciseRows || isSavingRef.current) {
      leaveEditScreen();

      return;
    }

    isSavingRef.current = true;

    try {
      saveWorkoutExerciseEdits(draftExerciseRows, baselineExerciseRows);
      leaveEditScreen();
    } catch (error) {
      isSavingRef.current = false;
      isConfirmedExitRef.current = false;
      console.error('Failed to save workout exercise edits', error);
      Alert.alert('Could not save exercise edits', 'Please try again.');
    }
  }, [
    baselineExerciseRows,
    draftExerciseRows,
    leaveEditScreen,
    saveWorkoutExerciseEdits
  ]);

  usePreventRemove(hasExerciseChanges, ({ data }) => {
    if (isSavingRef.current || isConfirmedExitRef.current) {
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
        onCancel={cancelExerciseEdits}
        onSave={saveExerciseEdits}
      />

      {isLoadingWorkoutExercises ? (
        <View className="flex-1 px-4">
          <LoadingState label="Loading exercises..." />
        </View>
      ) : (
        <ActiveWorkoutExerciseList
          workoutExercises={workoutExerciseRows}
          exerciseById={exerciseById}
          isEditing
          onEnterEditMode={() => undefined}
          draftExerciseRows={draftExerciseRows}
          onChangeDraftExerciseRows={setDraftExerciseRows}
        />
      )}
    </Screen>
  );
}

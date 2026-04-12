import { useDrizzle } from '@/src/components/database-provider';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { type Exercise, type Workout } from '@/src/db/schema';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { EmptyExerciseState } from '@/src/features/workouts/components/empty-exercise-state';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import {
  completeWorkout,
  createWorkoutExercise,
  getWorkoutExercisesQuery
} from '@/src/features/workouts/repository';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

type ActiveWorkoutContentProps = {
  activeWorkout: Workout;
  exerciseRows: Exercise[];
};

function formatDuration(startedAt: number, now = Date.now()) {
  const durationMinutes = Math.round((now - startedAt) / 60000);

  if (durationMinutes < 1) {
    return '< 1 min';
  }

  return `${durationMinutes} min`;
}

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: ActiveWorkoutContentProps) {
  const db = useDrizzle();
  const [now, setNow] = useState(() => Date.now());
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);

  const {
    data: workoutExerciseRows = [],
    updatedAt: workoutExercisesUpdatedAt
  } = useLiveQuery(getWorkoutExercisesQuery(db, activeWorkout.id), [
    db,
    activeWorkout.id
  ]);

  const isLoadingWorkoutExercises = !workoutExercisesUpdatedAt;

  const exerciseById = useMemo(
    () =>
      new Map<Exercise['id'], Exercise>(
        exerciseRows.map(exercise => [exercise.id, exercise])
      ),
    [exerciseRows]
  );

  useEffect(() => {
    setNow(Date.now());

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeWorkout]);

  const handleFinishWorkout = () => {
    completeWorkout(db, activeWorkout.id);
    router.replace('/(tabs)/workout');
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (isLoadingWorkoutExercises) {
      return;
    }

    createWorkoutExercise(db, {
      workoutId: activeWorkout.id,
      exerciseId: exercise.id,
      order: workoutExerciseRows.length,
      notes: null
    });
    setIsExercisePickerOpen(false);
  };

  return (
    <Screen withPadding={false} edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between gap-4 px-4 pt-4 pb-2">
        <Text variant="h2" className="flex-1">
          {activeWorkout.name}
        </Text>

        <Button
          variant="secondary"
          size="sm"
          disabled={
            isLoadingWorkoutExercises || workoutExerciseRows.length === 0
          }
          onPress={handleFinishWorkout}
        >
          Finish
        </Button>
      </View>

      <View className="px-4 pb-3">
        <Text variant="caption" tone="muted">
          {formatDuration(activeWorkout.startedAt, now)}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: 24
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoadingWorkoutExercises ? (
          <LoadingState label="Loading exercises..." />
        ) : workoutExerciseRows.length > 0 ? (
          <ActiveWorkoutExerciseList
            workoutExercises={workoutExerciseRows}
            exerciseById={exerciseById}
          />
        ) : (
          <EmptyExerciseState
            onAddExercise={() => setIsExercisePickerOpen(true)}
          />
        )}
      </ScrollView>

      <View className="border-border bg-background border-t px-4 py-4">
        <Button
          variant="secondary"
          className="w-full"
          disabled={isLoadingWorkoutExercises}
          leftIcon={
            <Icon icon={PlusIcon} size={16} className="text-foreground" />
          }
          onPress={() => setIsExercisePickerOpen(true)}
        >
          Add exercise
        </Button>
      </View>

      <ExercisePickerSheet
        isOpen={isExercisePickerOpen}
        exercises={exerciseRows}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={handleSelectExercise}
      />
    </Screen>
  );
}

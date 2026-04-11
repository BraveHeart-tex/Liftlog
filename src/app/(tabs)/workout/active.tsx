import { useDrizzle } from '@/src/components/database-provider';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import {
  exercises,
  workoutExercises,
  workouts,
  type Exercise
} from '@/src/db/schema';
import { getExercises } from '@/src/features/exercises/repository';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { EmptyExerciseState } from '@/src/features/workouts/components/empty-exercise-state';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { createLiveQuery } from '@/src/features/workouts/live-query';
import {
  completeWorkout,
  createWorkoutExercise,
  getActiveWorkout,
  getWorkoutWithExercises
} from '@/src/features/workouts/repository';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatDuration(startedAt: number, now = Date.now()) {
  const durationMinutes = Math.round((now - startedAt) / 60000);

  if (durationMinutes < 1) {
    return '< 1 min';
  }

  return `${durationMinutes} min`;
}

export default function ActiveWorkoutScreen() {
  const db = useDrizzle();
  const [now, setNow] = useState(() => Date.now());
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const { data: activeWorkoutData } = useLiveQuery(
    createLiveQuery(workouts, () => getActiveWorkout(db)),
    [db]
  );
  const activeWorkout = Array.isArray(activeWorkoutData)
    ? undefined
    : activeWorkoutData;
  const activeWorkoutId = activeWorkout?.id;
  const { data: workoutWithExercises } = useLiveQuery(
    createLiveQuery(workoutExercises, () => {
      if (!activeWorkoutId) {
        return undefined;
      }

      return getWorkoutWithExercises(db, activeWorkoutId);
    }),
    [db, activeWorkoutId]
  );
  const workoutExerciseRows = workoutWithExercises?.exercises ?? [];
  const { data: exerciseRows = [] } = useLiveQuery(
    createLiveQuery(exercises, () => getExercises(db)),
    [db]
  );

  const exerciseById = useMemo(
    () =>
      new Map<Exercise['id'], Exercise>(
        exerciseRows.map(exercise => [exercise.id, exercise])
      ),
    [exerciseRows]
  );

  useEffect(() => {
    if (!activeWorkout) {
      return;
    }

    setNow(Date.now());

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeWorkout]);

  const handleFinishWorkout = () => {
    if (!activeWorkout) {
      return;
    }

    completeWorkout(db, activeWorkout.id);
    router.replace('/(tabs)/workout');
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (!activeWorkout) {
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

  if (!activeWorkout) {
    return (
      <SafeAreaView
        style={{ flex: 1 }}
        className="bg-background"
        edges={['top']}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text variant="h3" className="text-center">
            No active workout
          </Text>
          <Button
            className="mt-4"
            onPress={() => router.replace('/(tabs)/workout')}
          >
            Go back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between gap-4 px-4 pt-4 pb-2">
        <Text variant="h2" className="flex-1">
          {activeWorkout.name}
        </Text>

        <Button
          variant="secondary"
          size="sm"
          disabled={workoutExerciseRows.length === 0}
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
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {workoutExerciseRows.length > 0 ? (
          <ActiveWorkoutExerciseList
            workout={activeWorkout}
            exerciseById={exerciseById}
          />
        ) : (
          <EmptyExerciseState
            onAddExercise={() => setIsExercisePickerOpen(true)}
          />
        )}
      </ScrollView>

      <SafeAreaView className="bg-background" edges={['bottom']}>
        <View className="border-border bg-background border-t px-4 py-4">
          <Button
            variant="secondary"
            className="w-full"
            leftIcon={
              <Icon icon={PlusIcon} size={16} className="text-foreground" />
            }
            onPress={() => setIsExercisePickerOpen(true)}
          >
            Add exercise
          </Button>
        </View>
      </SafeAreaView>

      <ExercisePickerSheet
        isOpen={isExercisePickerOpen}
        exercises={exerciseRows}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={handleSelectExercise}
      />
    </SafeAreaView>
  );
}

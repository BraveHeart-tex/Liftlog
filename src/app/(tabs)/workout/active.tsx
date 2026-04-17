import { useDrizzle } from '@/src/components/database-provider';
import { Button } from '@/src/components/ui/button';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { getExercisesQuery } from '@/src/features/exercises/repository';
import { ActiveWorkoutContent } from '@/src/features/workouts/components/active-workout-content';
import { getActiveWorkoutQuery } from '@/src/features/workouts/repository';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';

export default function ActiveWorkoutScreen() {
  const db = useDrizzle();

  const { data: activeWorkoutRows = [], updatedAt: activeWorkoutUpdatedAt } =
    useLiveQuery(getActiveWorkoutQuery(db), [db]);
  const activeWorkout = activeWorkoutRows[0];
  const { data: exerciseRows = [] } = useLiveQuery(getExercisesQuery(db), [db]);

  if (!activeWorkoutUpdatedAt) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading workout..." />
      </Screen>
    );
  }

  if (!activeWorkout) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          No active workout
        </Text>
        <Button
          className="mt-4"
          onPress={() => router.replace('/(tabs)/workout')}
        >
          Go back
        </Button>
      </Screen>
    );
  }

  return (
    // keyboard avoiding handled by BottomSheet internally
    <ActiveWorkoutContent
      activeWorkout={activeWorkout}
      exerciseRows={exerciseRows}
    />
  );
}

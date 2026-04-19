import { Button } from '@/src/components/ui/button';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutContent } from '@/src/features/workouts/components/active-workout-content';
import { useActiveWorkoutScreen } from '@/src/features/workouts/hooks';
import { router } from 'expo-router';

export default function ActiveWorkoutScreen() {
  const { activeWorkout, exerciseRows, isLoading } = useActiveWorkoutScreen();

  if (isLoading) {
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
    <ActiveWorkoutContent
      activeWorkout={activeWorkout}
      exerciseRows={exerciseRows}
    />
  );
}

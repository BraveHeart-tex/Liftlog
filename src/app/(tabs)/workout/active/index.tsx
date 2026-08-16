import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { ActiveWorkoutContent } from '@/src/features/workouts/components/active-workout-content';
import { useActiveWorkoutScreen } from '@/src/features/workouts/hooks/use-active-workout-screen';
import { router } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';

export default function ActiveWorkoutScreen() {
  const { activeWorkout, error, isLoading } = useActiveWorkoutScreen();

  if (error) {
    return (
      <Screen withPadding={false} edges={[]} contentClassName="px-6">
        <EmptyState className="flex-1 px-8">
          <EmptyState.Title weight="semiBold">
            Could not load workout
          </EmptyState.Title>
          <EmptyState.Description>
            Something went wrong while loading your active workout.
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
      </Screen>
    );
  }

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
        <EmptyState className="flex-1 px-8">
          <EmptyState.Title weight="semiBold">
            No active workout
          </EmptyState.Title>
          <EmptyState.Action>
            <Button
              leftIcon={<Icon as={ArrowLeftIcon} tone="primaryForeground" />}
              onPress={() => router.replace('/(tabs)/workout')}
            >
              Go back
            </Button>
          </EmptyState.Action>
        </EmptyState>
      </Screen>
    );
  }

  return <ActiveWorkoutContent activeWorkout={activeWorkout} />;
}

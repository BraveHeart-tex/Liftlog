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

  return <ActiveWorkoutContent activeWorkout={activeWorkout} />;
}

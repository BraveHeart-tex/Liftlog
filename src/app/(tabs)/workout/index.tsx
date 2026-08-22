import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutSummaryCard } from '@/src/features/workouts/components/active-workout-summary-card';
import { RecentWorkoutsSection } from '@/src/features/workouts/components/recent-workouts-section';
import { WorkoutTemplatesSection } from '@/src/features/workouts/components/workout-templates-section';
import { useWorkoutStart } from '@/src/features/workouts/hooks/use-workout-start';
import { useFocusEffect } from 'expo-router';
import { DumbbellIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

export default function WorkoutStartScreen() {
  const { activeWorkout, startWorkout, resumeWorkout } = useWorkoutStart();
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsStartingWorkout(false);
    }, [])
  );

  const handleStartWorkout = useCallback(() => {
    if (isStartingWorkout) {
      return;
    }

    // Keep the CTA mounted while the live query reflects the newly-created
    // workout. The active route is still transitioning in above this screen.
    setIsStartingWorkout(true);
    startWorkout();
  }, [isStartingWorkout, startWorkout]);

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <Text variant="h1">Workout</Text>

      {activeWorkout && !isStartingWorkout ? (
        <View>
          <ActiveWorkoutSummaryCard
            workout={activeWorkout}
            onPress={resumeWorkout}
          />
        </View>
      ) : (
        <View className="mb-6 gap-4">
          <Button
            className="mt-6 h-14"
            leftIcon={<Icon as={DumbbellIcon} tone="primaryForeground" />}
            fullWidth
            disabled={isStartingWorkout}
            onPress={handleStartWorkout}
          >
            Start Workout
          </Button>
          <Text tone="muted" variant="caption" className="text-center">
            Log exercises as you go, no setup needed.
          </Text>
        </View>
      )}

      <WorkoutTemplatesSection />
      <RecentWorkoutsSection />
    </Screen>
  );
}

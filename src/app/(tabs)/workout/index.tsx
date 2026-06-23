import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutSummaryCard } from '@/src/features/workouts/components/active-workout-summary-card';
import { RecentWorkoutsSection } from '@/src/features/workouts/components/recent-workouts-section';
import { WorkoutTemplatesSection } from '@/src/features/workouts/components/workout-templates-section';
import { useWorkoutStart } from '@/src/features/workouts/hooks';
import { router } from 'expo-router';
import { SettingsIcon } from 'lucide-react-native';
import { View } from 'react-native';

export default function WorkoutStartScreen() {
  const { activeWorkout, startWorkout, resumeWorkout } = useWorkoutStart();

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <View className="flex-row items-center justify-between gap-4">
        <Text variant="h1">Workout</Text>
        <Button
          variant="secondary"
          size="icon"
          accessibilityLabel="Open settings"
          onPress={() => router.push('/settings')}
        >
          <Icon icon={SettingsIcon} size="md" tone="secondaryForeground" />
        </Button>
      </View>

      {activeWorkout ? (
        <ActiveWorkoutSummaryCard
          workout={activeWorkout}
          onPress={resumeWorkout}
        />
      ) : (
        <View className="gap-4">
          <Button className="mt-6 w-full" onPress={startWorkout}>
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

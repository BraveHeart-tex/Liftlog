import { Button } from '@/src/components/ui/button';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutSummaryCard } from '@/src/features/workouts/components/active-workout-summary-card';
import { RecentWorkoutsSection } from '@/src/features/workouts/components/recent-workouts-section';
import { WorkoutTemplatesSection } from '@/src/features/workouts/components/workout-templates-section';
import { useWorkoutStart } from '@/src/features/workouts/hooks';
import { View } from 'react-native';

export default function WorkoutStartScreen() {
  const {
    activeWorkout,
    recentWorkouts,
    templates,
    startWorkout,
    resumeWorkout
  } = useWorkoutStart();

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <Text variant="h1">Workout</Text>

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

      <WorkoutTemplatesSection templates={templates} />
      <RecentWorkoutsSection recentWorkouts={recentWorkouts} />
    </Screen>
  );
}

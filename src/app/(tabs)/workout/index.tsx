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
      <View>
        <Text variant="h1">Workout</Text>
        <Text variant="small" tone="muted" className="mt-2">
          Start a new session or resume where you left off.
        </Text>
      </View>

      {activeWorkout ? (
        <ActiveWorkoutSummaryCard
          workout={activeWorkout}
          onPress={resumeWorkout}
        />
      ) : (
        <Button className="mt-6 w-full" onPress={startWorkout}>
          Start Workout
        </Button>
      )}

      <WorkoutTemplatesSection templates={templates} />
      <RecentWorkoutsSection recentWorkouts={recentWorkouts} />
    </Screen>
  );
}

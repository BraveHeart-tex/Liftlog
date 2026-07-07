import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutSummaryCard } from '@/src/features/workouts/components/active-workout-summary-card';
import { RecentWorkoutsSection } from '@/src/features/workouts/components/recent-workouts-section';
import { WorkoutTemplatesSection } from '@/src/features/workouts/components/workout-templates-section';
import { useWorkoutStart } from '@/src/features/workouts/hooks/use-workout-start';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { router } from 'expo-router';
import { DumbbellIcon, SettingsIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

const workoutStateEntering = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 8 }, { scale: 0.98 }]
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }]
  }
}).duration(MOTION_DURATION_MS.standard);

const workoutStateExiting = new Keyframe({
  0: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }]
  },
  100: {
    opacity: 0,
    transform: [{ translateY: -6 }, { scale: 0.98 }]
  }
}).duration(MOTION_DURATION_MS.exit);

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
          onPress={() => router.navigate('/settings')}
        >
          <Icon as={SettingsIcon} size="md" tone="secondaryForeground" />
        </Button>
      </View>

      {activeWorkout ? (
        <Animated.View
          key="active-workout-summary"
          entering={workoutStateEntering}
          exiting={workoutStateExiting}
        >
          <ActiveWorkoutSummaryCard
            workout={activeWorkout}
            onPress={resumeWorkout}
          />
        </Animated.View>
      ) : (
        <Animated.View
          key="start-workout-cta"
          className="gap-4"
          entering={workoutStateEntering}
          exiting={workoutStateExiting}
        >
          <Button
            className="mt-6"
            leftIcon={<Icon as={DumbbellIcon} tone="primaryForeground" />}
            containerClassName="w-full"
            onPress={startWorkout}
          >
            Start Workout
          </Button>
          <Text tone="muted" variant="caption" className="text-center">
            Log exercises as you go, no setup needed.
          </Text>
        </Animated.View>
      )}

      <WorkoutTemplatesSection />
      <RecentWorkoutsSection />
    </Screen>
  );
}

import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { PulsatingDot } from '@/src/components/ui/pulsating-dot';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { ActiveWorkoutDuration } from '@/src/features/workouts/active/components/active-workout-duration';
import { ActiveWorkoutStats } from '@/src/features/workouts/active/components/active-workout-stats';
import { usePressScale } from '@/src/lib/animations/use-press-scale.hook';
import { cn } from '@/src/lib/utils/cn.utils';
import { PlayIcon } from 'lucide-react-native';
import {
  Animated,
  Pressable,
  View,
  type GestureResponderEvent
} from 'react-native';

interface ActiveWorkoutSummaryCardProps {
  workout: Workout & {
    completedSetCount: number;
    exerciseCount: number;
  };
  onPress: () => void;
}

export const ActiveWorkoutSummaryCard = ({
  workout,
  onPress
}: ActiveWorkoutSummaryCardProps) => {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();
  const stopPressPropagation = (event: GestureResponderEvent) => {
    event.stopPropagation();
  };

  const handleResumePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onPress();
  };

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className="mt-6"
      >
        <View className={cn('gap-4', pressed ? 'opacity-80' : '')}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <PulsatingDot />
              <Text variant="overline" tone="muted">
                In progress
              </Text>
            </View>
            <ActiveWorkoutDuration startedAt={workout.startedAt} />
          </View>
          <Text variant="h2">{workout.name}</Text>
          <ActiveWorkoutStats
            exerciseCount={workout.exerciseCount}
            completedSetCount={workout.completedSetCount}
          />
          <Button
            className="h-14"
            leftIcon={<Icon as={PlayIcon} tone="primaryForeground" />}
            onPress={handleResumePress}
            onPressIn={stopPressPropagation}
            onPressOut={stopPressPropagation}
          >
            Resume Workout
          </Button>
        </View>
      </Pressable>
    </Animated.View>
  );
};

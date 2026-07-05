import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { PulsatingDot } from '@/src/components/ui/pulsating-dot';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { ActiveWorkoutDuration } from '@/src/features/workouts/components/active-workout-duration';
import { ActiveWorkoutStats } from '@/src/features/workouts/components/active-workout-stats';
import { usePressScale } from '@/src/lib/animations/use-press-scale.hook';
import { PlayIcon } from 'lucide-react-native';
import { Animated, Pressable, View } from 'react-native';

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

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className="mt-6"
      >
        <Card
          className={pressed ? 'border-primary opacity-80' : 'border-primary'}
        >
          <CardContent>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <PulsatingDot />
                <Text variant="overline" tone="muted">
                  In progress
                </Text>
              </View>
              <ActiveWorkoutDuration startedAt={workout.startedAt} />
            </View>
            <Text variant="h3" className="mt-2">
              {workout.name}
            </Text>
            <ActiveWorkoutStats
              exerciseCount={workout.exerciseCount}
              completedSetCount={workout.completedSetCount}
            />
            <Button
              leftIcon={<Icon as={PlayIcon} tone="primaryForeground" />}
              onPress={onPress}
            >
              Resume Workout
            </Button>
          </CardContent>
        </Card>
      </Pressable>
    </Animated.View>
  );
};

import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { formatDuration } from '@/src/lib/utils/date';
import { useEffect, useState } from 'react';
import { Animated, Pressable } from 'react-native';

interface ActiveWorkoutSummaryCardProps {
  workout: Workout;
  onPress: () => void;
}

export const ActiveWorkoutSummaryCard = ({
  workout,
  onPress
}: ActiveWorkoutSummaryCardProps) => {
  const [now, setNow] = useState(() => Date.now());
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  useEffect(() => {
    setNow(Date.now());

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [workout]);

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
            <Text variant="caption" tone="muted">
              Workout in progress
            </Text>
            <Text variant="bodyMedium" className="mt-2">
              {workout.name}
            </Text>
            <Text variant="small" tone="muted" className="mt-2">
              {formatDuration({
                startedAt: workout.startedAt,
                completedAt: now
              })}
            </Text>
          </CardContent>
        </Card>
      </Pressable>
    </Animated.View>
  );
};

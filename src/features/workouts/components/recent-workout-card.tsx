import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { Animated, Pressable, View } from 'react-native';

interface RecentWorkoutCardProps {
  workout: Workout;
  className?: string;
  onPress: () => void;
}

export const RecentWorkoutCard = ({
  workout,
  className,
  onPress
}: RecentWorkoutCardProps) => {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cn(
          'border-border bg-card rounded-lg border p-4',
          pressed && 'opacity-80',
          className
        )}
      >
        <Text variant="bodyMedium">{workout.name}</Text>
        <View className="mt-2 flex-row items-center gap-3">
          <Text variant="caption" tone="muted">
            {formatWorkoutDate(workout.startedAt)}
          </Text>
          <Text variant="caption" tone="muted">
            {formatDuration({
              startedAt: workout.startedAt,
              completedAt: workout.completedAt
            })}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

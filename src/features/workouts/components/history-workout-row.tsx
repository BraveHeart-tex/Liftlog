import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { Animated, Pressable, View } from 'react-native';

interface HistoryWorkoutRowProps {
  workout: Workout;
  setCount: number;
  onPress: (workout: Workout) => void;
}

export function HistoryWorkoutRow({
  workout,
  setCount,
  onPress
}: HistoryWorkoutRowProps) {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={() => onPress(workout)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cn(
          'border-border bg-card mt-3 rounded-lg border p-4',
          pressed && 'opacity-80'
        )}
      >
        <View className="flex-row items-start justify-between gap-4">
          <Text variant="bodyMedium" className="flex-1">
            {workout.name}
          </Text>
          <Text variant="caption" tone="muted">
            {formatDuration({
              startedAt: workout.startedAt,
              completedAt: workout.completedAt
            })}
          </Text>
        </View>

        <View className="mt-2 flex-row items-center justify-between gap-4">
          <Text variant="caption" tone="muted" className="flex-1">
            {formatWorkoutDate(workout.startedAt)}
          </Text>
          <Text variant="caption" tone="muted">
            {setCount} {setCount === 1 ? 'set' : 'sets'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

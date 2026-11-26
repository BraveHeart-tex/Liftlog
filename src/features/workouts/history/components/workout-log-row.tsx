import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date.utils';
import { View } from 'react-native';

interface WorkoutLogRowProps {
  workout: Workout;
  setCount: number;
  onPress: (workout: Workout) => void;
}

export function WorkoutLogRow({
  workout,
  setCount,
  onPress
}: WorkoutLogRowProps) {
  return (
    <PressableSurface
      onPress={() => onPress(workout)}
      className="border-border bg-card mt-3 rounded-lg border p-4"
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
    </PressableSurface>
  );
}

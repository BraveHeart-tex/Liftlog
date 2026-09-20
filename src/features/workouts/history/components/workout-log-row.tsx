import { Text } from '@/src/components/ui/text';
import { usePressScale } from '@/src/lib/animations/use-press-scale.hook';
import { cn } from '@/src/lib/utils/cn.utils';
import { Animated, Pressable, View } from 'react-native';

interface WorkoutLogRowProps {
  name: string;
  durationLabel: string;
  dateLabel: string;
  setCountLabel: string;
  onPress: () => void;
}

export function WorkoutLogRow({
  name,
  durationLabel,
  dateLabel,
  setCountLabel,
  onPress
}: WorkoutLogRowProps) {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cn(
          'border-border bg-card mt-3 rounded-lg border p-4',
          pressed && 'opacity-80'
        )}
      >
        <View className="flex-row items-start justify-between gap-4">
          <Text variant="bodyMedium" className="flex-1">
            {name}
          </Text>
          <Text variant="caption" tone="muted">
            {durationLabel}
          </Text>
        </View>

        <View className="mt-2 flex-row items-center justify-between gap-4">
          <Text variant="caption" tone="muted" className="flex-1">
            {dateLabel}
          </Text>
          <Text variant="caption" tone="muted">
            {setCountLabel}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

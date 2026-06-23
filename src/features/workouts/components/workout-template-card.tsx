import { Text } from '@/src/components/ui/text';
import type { WorkoutStartTemplateItem } from '@/src/features/workouts/hooks/use-workout-templates';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { Animated, Pressable, View } from 'react-native';

interface WorkoutTemplateCardProps {
  item: WorkoutStartTemplateItem;
  className?: string;
  onPress: () => void;
}

const CARD_WIDTH = 220;
const CARD_HEIGHT = 102;

export const WorkoutTemplateCard = ({
  item,
  className,
  onPress
}: WorkoutTemplateCardProps) => {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View
      style={[
        scaleStyle,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          flexShrink: 0
        }
      ]}
    >
      <Pressable
        style={{ flex: 1 }}
        className={cn(
          'border-border bg-card justify-between rounded-lg border p-4',
          pressed && 'opacity-80',
          className
        )}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View>
          <Text variant="bodyMedium" numberOfLines={1}>
            {item.template.name}
          </Text>

          <Text variant="small" tone="muted" className="mt-1">
            {item.exerciseCount === 1
              ? '1 exercise'
              : `${item.exerciseCount} exercises`}
          </Text>
        </View>

        <Text variant="caption" tone="muted" numberOfLines={2}>
          {item.exerciseSummary}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

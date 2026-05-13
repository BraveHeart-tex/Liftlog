import { Text } from '@/src/components/ui/text';
import type { WorkoutStartTemplateItem } from '@/src/features/workouts/hooks/use-workout-start';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { Animated, Pressable, View } from 'react-native';

interface WorkoutTemplateCardProps {
  item: WorkoutStartTemplateItem;
  className?: string;
  onPress: () => void;
}

export const WorkoutTemplateCard = ({
  item,
  className,
  onPress
}: WorkoutTemplateCardProps) => {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle}>
      <View
        className={cn(
          'border-border bg-card rounded-lg border p-4',
          pressed && 'opacity-80',
          className
        )}
      >
        <Pressable
          className="min-h-12 flex-1 justify-center"
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Text variant="bodyMedium">{item.template.name}</Text>
          <Text variant="small" tone="muted" className="mt-1">
            {item.exerciseCount === 1
              ? '1 exercise'
              : `${item.exerciseCount} exercises`}
          </Text>
          <Text variant="caption" tone="muted" className="mt-2">
            {item.exerciseSummary}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

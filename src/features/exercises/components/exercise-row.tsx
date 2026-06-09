import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import type { ReactNode } from 'react';
import {
  Animated,
  Pressable,
  View,
  type AccessibilityState
} from 'react-native';

interface ExerciseRowProps {
  exercise: ExerciseListItem;
  subtitle: string;
  onPress: (exercise: ExerciseListItem) => void;
  disabled?: boolean;
  accessibilityState?: AccessibilityState;
  className?: string;
  titleClassName?: string;
  rightAccessory?: ReactNode;
}

export function ExerciseRow({
  exercise,
  subtitle,
  onPress,
  disabled = false,
  accessibilityState,
  className,
  titleClassName,
  rightAccessory
}: ExerciseRowProps) {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={() => !disabled && onPress(exercise)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityState={accessibilityState}
        className={cn(
          'border-border flex-row items-center justify-between border-b py-4',
          className,
          pressed && !disabled && 'opacity-70'
        )}
      >
        <View className="flex-1 pr-4">
          <Text variant="bodyMedium" className={titleClassName}>
            {exercise.name}
          </Text>
          <Text variant="small" tone="muted" className="mt-0.5">
            {subtitle}
          </Text>
        </View>

        {rightAccessory}
      </Pressable>
    </Animated.View>
  );
}

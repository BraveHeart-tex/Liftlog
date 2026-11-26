import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { cn } from '@/src/lib/utils/cn.utils';
import type { ReactNode } from 'react';
import { View, type AccessibilityState } from 'react-native';

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
  return (
    <PressableSurface
      onPress={() => onPress(exercise)}
      disabled={disabled}
      accessibilityState={accessibilityState}
      className={cn(
        'border-border flex-row items-center justify-between border-b py-4 active:opacity-70',
        className
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
    </PressableSurface>
  );
}

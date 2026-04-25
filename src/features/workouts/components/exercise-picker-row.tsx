import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { getCategoryLabel } from '@/src/features/workouts/components/utils';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { Animated, Pressable } from 'react-native';

interface ExercisePickerRowProps {
  exercise: ExerciseListItem;
  onPress: (exercise: ExerciseListItem) => void;
}

export const ExercisePickerRow = ({
  exercise,
  onPress
}: ExercisePickerRowProps) => {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={() => onPress(exercise)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cn(
          'border-border bg-card mt-3 rounded-lg border p-4',
          pressed && 'opacity-80'
        )}
      >
        <Text variant="bodyMedium">{exercise.name}</Text>
        <Text variant="small" tone="muted" className="mt-1">
          {getCategoryLabel(exercise.category)}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

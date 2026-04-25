import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { getPrimaryMuscleLabel } from '@/src/lib/utils/muscle';
import { toTitleCase } from '@/src/lib/utils/string';
import { Animated, Pressable } from 'react-native';

interface ExerciseListRowProps {
  exercise: ExerciseListItem;
  onPress: (exercise: ExerciseListItem) => void;
}

export function ExerciseListRow({ exercise, onPress }: ExerciseListRowProps) {
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
          {toTitleCase(getPrimaryMuscleLabel(exercise.primaryMuscles))}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

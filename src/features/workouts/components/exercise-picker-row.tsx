import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { getCategoryLabel } from '@/src/features/workouts/components/utils';
import { cn } from '@/src/lib/utils/cn';
import { useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';

interface ExercisePickerRowProps {
  exercise: ExerciseListItem;
  onPress: (exercise: ExerciseListItem) => void;
}

export const ExercisePickerRow = ({
  exercise,
  onPress
}: ExercisePickerRowProps) => {
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onPress(exercise)}
        onPressIn={() => {
          setPressed(true);
          animateScale(0.97);
        }}
        onPressOut={() => {
          setPressed(false);
          animateScale(1);
        }}
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

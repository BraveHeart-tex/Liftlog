import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { getCategoryLabel } from '@/src/features/workouts/components/utils';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { PlusIcon } from 'lucide-react-native';
import { Animated, Pressable, View } from 'react-native';

interface ExercisePickerRowProps {
  exercise: ExerciseListItem;
  isSelected?: boolean;
  onPress: (exercise: ExerciseListItem) => void;
}

export const ExercisePickerRow = ({
  exercise,
  isSelected = false,
  onPress
}: ExercisePickerRowProps) => {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();
  const metadataLabel =
    exercise.isCustom === 1 ? 'Custom' : getCategoryLabel(exercise.category);

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={() => !isSelected && onPress(exercise)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isSelected}
        className={cn(
          'border-border flex-row items-center justify-between border-b py-4',
          pressed && !isSelected && 'opacity-70'
        )}
      >
        <View className="flex-1 pr-4">
          <Text
            variant="bodyMedium"
            className={cn(isSelected && 'text-muted-foreground line-through')}
          >
            {exercise.name}
          </Text>
          <Text variant="small" tone="muted" className="mt-0.5">
            {metadataLabel}
          </Text>
        </View>

        {isSelected ? (
          <View className="bg-muted rounded-md px-3 py-1.5">
            <Text variant="small" tone="muted">
              Added
            </Text>
          </View>
        ) : (
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onPress={() => onPress(exercise)}
          >
            <Icon
              icon={PlusIcon}
              size="sm"
              className="text-secondary-foreground"
            />
          </Button>
        )}
      </Pressable>
    </Animated.View>
  );
};

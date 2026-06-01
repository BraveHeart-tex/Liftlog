import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { ExerciseRow } from '@/src/features/exercises/components/exercise-row';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { getCategoryLabel } from '@/src/features/workouts/components/utils';
import { cn } from '@/src/lib/utils/cn';
import { PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';

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
  const metadataLabel =
    exercise.isCustom === 1 ? 'Custom' : getCategoryLabel(exercise.category);

  return (
    <ExerciseRow
      exercise={exercise}
      subtitle={metadataLabel}
      onPress={onPress}
      disabled={isSelected}
      titleClassName={cn(isSelected && 'text-muted-foreground line-through')}
      rightAccessory={
        isSelected ? (
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
        )
      }
    />
  );
};

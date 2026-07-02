import { Icon } from '@/src/components/ui/icon';
import { ExerciseRow } from '@/src/features/exercises/components/exercise-row';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { getCategoryLabel } from '@/src/features/workouts/components/utils';
import { cn } from '@/src/lib/utils/cn';
import { CheckIcon, PlusIcon } from 'lucide-react-native';
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
      accessibilityState={{ selected: isSelected }}
      className={cn(isSelected && 'bg-secondary rounded-lg px-3')}
      titleClassName={cn(isSelected && 'text-secondary-foreground')}
      rightAccessory={
        <View
          className={cn(
            'border-border bg-card h-12 w-12 items-center justify-center rounded-full border',
            isSelected && 'border-primary bg-primary'
          )}
        >
          <Icon
            as={isSelected ? CheckIcon : PlusIcon}
            size="sm"
            tone={isSelected ? 'primaryForeground' : 'secondaryForeground'}
          />
        </View>
      }
    />
  );
};

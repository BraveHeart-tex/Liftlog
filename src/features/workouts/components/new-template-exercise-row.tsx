import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { getCategoryLabel } from '@/src/features/workouts/components/utils';
import { cn } from '@/src/lib/utils/cn';
import { iconSizes } from '@/src/theme/sizes';
import { GripIcon, TrashIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface NewTemplateExerciseRowProps {
  exercise: ExerciseListItem;
  isDragging: boolean;
  onDelete: () => void;
  onDrag: () => void;
  shouldShowDragHandle: boolean;
}

export function NewTemplateExerciseRow({
  exercise,
  isDragging,
  onDelete,
  onDrag,
  shouldShowDragHandle
}: NewTemplateExerciseRowProps) {
  const subtitle =
    exercise.isCustom === 1 ? 'Custom' : getCategoryLabel(exercise.category);

  return (
    <View
      className={cn(
        'border-border flex-row items-center gap-3 border-b py-4',
        isDragging && 'bg-muted/50'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={`Delete ${exercise.name}`}
        onPress={onDelete}
      >
        <Icon as={TrashIcon} size={iconSizes.sm} tone="danger" />
      </Button>

      <View className="flex-1">
        <Text variant="bodyMedium" numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text variant="small" tone="muted" className="mt-0.5">
          {subtitle}
        </Text>
      </View>

      {shouldShowDragHandle && (
        <Button
          variant="ghost"
          size="icon"
          disabled={isDragging}
          accessibilityLabel={`Reorder ${exercise.name}`}
          onPressIn={onDrag}
        >
          <Icon as={GripIcon} size={iconSizes.sm} tone="mutedForeground" />
        </Button>
      )}
    </View>
  );
}

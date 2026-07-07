import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { getCategoryLabel } from '@/src/features/workouts/components/workout-components.utils';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { GripIcon, TrashIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Sortable from 'react-native-sortables';

interface NewTemplateExerciseRowProps {
  exercise: ExerciseListItem;
  isDragging: boolean;
  label?: string;
  onDelete: () => void;
  shouldShowDragHandle: boolean;
}

export function NewTemplateExerciseRow({
  exercise,
  isDragging,
  label,
  onDelete,
  shouldShowDragHandle
}: NewTemplateExerciseRowProps) {
  const subtitle =
    exercise.isCustom === 1 ? 'Custom' : getCategoryLabel(exercise.category);

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 py-3',
        isDragging && 'bg-muted/50'
      )}
    >
      {label ? (
        <View className="bg-muted h-8 w-8 items-center justify-center rounded-lg">
          <Text variant="caption" tone="muted">
            {label}
          </Text>
        </View>
      ) : null}

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
        <Sortable.Handle>
          <Button
            variant="ghost"
            size="icon"
            disabled={isDragging}
            accessibilityLabel={`Reorder ${exercise.name}`}
          >
            <Icon as={GripIcon} size={iconSizes.sm} tone="mutedForeground" />
          </Button>
        </Sortable.Handle>
      )}
    </View>
  );
}

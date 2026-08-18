import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { ReorderableHandle } from '@/src/components/ui/reorderable-list';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { getCategoryLabel } from '@/src/features/workouts/components/workout-components.utils';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { GripIcon, TrashIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface NewTemplateExerciseRowProps {
  exercise?: ExerciseListItem;
  className?: string;
  isDragging: boolean;
  onDelete?: () => void;
  shouldShowDragHandle?: boolean;
}

export function NewTemplateExerciseRow({
  exercise,
  className,
  isDragging,
  onDelete,
  shouldShowDragHandle = false
}: NewTemplateExerciseRowProps) {
  const subtitle =
    exercise === undefined
      ? 'Exercise'
      : exercise.isCustom === 1
        ? 'Custom'
        : getCategoryLabel(exercise.category);

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 py-3',
        isDragging && 'bg-muted/50',
        className
      )}
    >
      <View className="flex-1">
        <Text variant="bodyMedium" numberOfLines={1}>
          {exercise?.name ?? 'Unknown exercise'}
        </Text>
        <Text variant="small" tone="muted" className="mt-0.5">
          {subtitle}
        </Text>
      </View>

      <View className="shrink-0 flex-row items-center gap-1">
        {onDelete ? (
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel={`Delete ${exercise?.name ?? 'exercise'}`}
            onPress={onDelete}
          >
            <Icon as={TrashIcon} size={iconSizes.sm} tone="danger" />
          </Button>
        ) : null}

        {shouldShowDragHandle ? (
          <ReorderableHandle>
            {({ onPressIn }) => (
              <Button
                variant="ghost"
                size="icon"
                disabled={isDragging}
                accessibilityLabel={`Reorder ${exercise.name}`}
                onPressIn={onPressIn}
              >
                <Icon
                  as={GripIcon}
                  size={iconSizes.sm}
                  tone="mutedForeground"
                />
              </Button>
            )}
          </ReorderableHandle>
        ) : null}
      </View>
    </View>
  );
}

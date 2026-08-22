import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { ReorderableHandle } from '@/src/components/ui/reorderable-list';
import { Text } from '@/src/components/ui/text';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/shared/workout-components.types';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { EllipsisIcon, GripIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface ActiveWorkoutExerciseEditRowProps {
  item: WorkoutExerciseWithSets;
  className?: string;
  isDragging: boolean;
  label?: string;
  onOpenActions?: () => void;
  shouldShowDragHandle: boolean;
}

export function ActiveWorkoutExerciseEditRow({
  item,
  className,
  isDragging,
  label,
  onOpenActions,
  shouldShowDragHandle = true
}: ActiveWorkoutExerciseEditRowProps) {
  const detail = `${item.sets.length} ${
    item.sets.length === 1 ? 'set' : 'sets'
  }`;

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 py-1',
        isDragging && 'bg-muted/50',
        className
      )}
    >
      {label ? (
        <View className="w-10">
          <Text variant="body" tone="muted">
            {label}
          </Text>
        </View>
      ) : null}

      <View className="flex-1">
        <Text variant="bodyMedium" numberOfLines={1}>
          {item.exercise?.name ?? 'Unknown exercise'}
        </Text>
        <Text variant="caption" tone="muted" className="mt-0.5">
          {detail}
        </Text>
      </View>

      <View className="shrink-0 flex-row items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={`Actions for ${item.exercise?.name ?? 'exercise'}`}
          onPress={onOpenActions}
        >
          <Icon as={EllipsisIcon} size="lg" tone="mutedForeground" />
        </Button>

        {shouldShowDragHandle ? (
          <ReorderableHandle>
            {({ onPressIn }) => (
              <Button
                variant="ghost"
                size="icon"
                disabled={isDragging}
                accessibilityLabel="Drag exercise"
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

import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { ReorderableHandle } from '@/src/components/ui/reorderable-list';
import { Text } from '@/src/components/ui/text';
import { resolveTrackingType } from '@/src/features/progress/tracking.domain';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/workout-components.types';
import { cn } from '@/src/lib/utils/cn.utils';
import { formatWeightForUnit } from '@/src/lib/utils/weight.utils';
import { iconSizes } from '@/src/theme/sizes';
import { GripIcon, TrashIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface ActiveWorkoutExerciseEditRowProps {
  item: WorkoutExerciseWithSets;
  className?: string;
  isDragging: boolean;
  label?: string;
  onRemove?: () => void;
  shouldShowDragHandle: boolean;
}

export function ActiveWorkoutExerciseEditRow({
  item,
  className,
  isDragging,
  label,
  onRemove,
  shouldShowDragHandle = true
}: ActiveWorkoutExerciseEditRowProps) {
  const { weightUnit } = useSettings();
  const completedSets = item.sets.filter(set => set.status === 'completed');
  const trackingType = resolveTrackingType(item.exercise?.trackingType);
  const volume = completedSets.reduce(
    (sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0),
    0
  );
  const setLabel = `${completedSets.length} ${
    completedSets.length === 1 ? 'set' : 'sets'
  }`;
  const detail =
    trackingType === 'weight_reps' && volume > 0
      ? `${setLabel} · ${formatWeightForUnit(volume, weightUnit, {
          useGrouping: true,
          maximumFractionDigits: 0
        })} ${weightUnit}`
      : setLabel;

  const handleRemoveExercise = () => {
    const exerciseName = item.exercise?.name ?? 'Unknown exercise';
    const setCount = item.sets.length;
    const completedSetCount = completedSets.length;
    const selectedDetails =
      setCount > 0
        ? `${exerciseName}\n${setCount} sets logged, ${completedSetCount} completed.`
        : `${exerciseName}\nNo sets logged yet.`;

    void confirmDialog({
      title: 'Remove exercise?',
      message: `${selectedDetails}\n\nThis exercise and its sets will be removed from the workout when you save.`,
      confirmLabel: 'Remove',
      destructive: true
    }).then(confirmed => {
      if (confirmed) {
        onRemove?.();
      }
    });
  };

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 py-3',
        isDragging && 'bg-muted/50',
        className
      )}
    >
      {label ? (
        <View className="bg-muted h-8 w-8 items-center justify-center rounded-lg">
          <Text variant="caption" tone="muted">
            {label}
          </Text>
        </View>
      ) : null}

      <Button variant="ghost" size="icon" onPress={handleRemoveExercise}>
        <Icon as={TrashIcon} size={iconSizes.sm} tone="danger" />
      </Button>

      <View className="flex-1">
        <Text variant="bodyMedium" numberOfLines={1}>
          {item.exercise?.name ?? 'Unknown exercise'}
        </Text>
        <Text variant="small" tone="muted" className="mt-0.5">
          {detail}
        </Text>
      </View>

      {shouldShowDragHandle && (
        <ReorderableHandle>
          {({ onPressIn }) => (
            <Button
              variant="ghost"
              size="icon"
              disabled={isDragging}
              accessibilityLabel="Drag exercise"
              onPressIn={onPressIn}
            >
              <Icon as={GripIcon} size={iconSizes.sm} tone="mutedForeground" />
            </Button>
          )}
        </ReorderableHandle>
      )}
    </View>
  );
}

import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { resolveTrackingType } from '@/src/features/progress/tracking';
import { useSettings } from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { iconSizes } from '@/src/theme/sizes';
import { GripIcon, TrashIcon } from 'lucide-react-native';
import { View } from 'react-native';
import type { WorkoutExerciseWithSets } from './types';

interface ActiveWorkoutExerciseEditRowProps {
  item: WorkoutExerciseWithSets;
  className?: string;
}

export function ActiveWorkoutExerciseEditRow({
  item,
  className
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

  return (
    <View
      className={cn(
        'border-border flex-row items-center gap-3 border-b py-4',
        className
      )}
    >
      <Button variant="ghost" size="icon">
        <Icon icon={TrashIcon} size={iconSizes.sm} className="text-danger" />
      </Button>

      <View className="flex-1">
        <Text variant="bodyMedium" numberOfLines={1}>
          {item.exercise?.name ?? 'Unknown exercise'}
        </Text>
        <Text variant="small" tone="muted" className="mt-0.5">
          {detail}
        </Text>
      </View>

      <Button variant="ghost" size="icon">
        <Icon
          icon={GripIcon}
          size={iconSizes.sm}
          className="text-muted-foreground"
        />
      </Button>
    </View>
  );
}

import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  formatWeightForUnit,
  type WeightUnit
} from '@/src/lib/utils/weight.utils';
import { View } from 'react-native';
import { WorkoutSetSummary } from '@/src/features/workouts/components/workout-set-summary';

interface WorkoutExerciseSummaryProps {
  exerciseName: string;
  supersetLabel?: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType?: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
  emptyText?: string;
  className?: string;
}

export function WorkoutExerciseSummary({
  exerciseName,
  supersetLabel,
  completedSets,
  weightUnit,
  trackingType = 'weight_reps',
  personalRecordSetIds,
  emptyText,
  className
}: WorkoutExerciseSummaryProps) {
  const exerciseVolume = completedSets.reduce((sum, set) => {
    if (set.weightKg === null || set.reps === null) {
      return sum;
    }

    return sum + set.weightKg * set.reps;
  }, 0);
  const shouldShowVolume = trackingType === 'weight_reps';

  return (
    <View className={cn('gap-3', className)}>
      <View>
        {supersetLabel ? (
          <Text variant="caption" tone="muted" className="mb-1">
            {supersetLabel}
          </Text>
        ) : null}
        <Text variant="bodyMedium" numberOfLines={2}>
          {exerciseName}
        </Text>
        {completedSets.length > 0 ? (
          <Text variant="small" tone="muted" className="mt-0.5">
            {shouldShowVolume
              ? `${formatWeightForUnit(exerciseVolume, weightUnit, {
                  useGrouping: true,
                  maximumFractionDigits: 0
                })} ${weightUnit}`
              : ''}
          </Text>
        ) : null}
      </View>

      <WorkoutSetSummary
        completedSets={completedSets}
        weightUnit={weightUnit}
        trackingType={trackingType}
        personalRecordSetIds={personalRecordSetIds}
        emptyText={emptyText}
      />
    </View>
  );
}

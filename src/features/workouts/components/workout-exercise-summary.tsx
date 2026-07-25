import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db';
import {
  formatTrackingValue,
  getSetValues,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  formatWeightForUnit,
  type WeightUnit
} from '@/src/lib/utils/weight.utils';
import { View } from 'react-native';
import { WorkoutSetSummary } from '@/src/features/workouts/components/workout-set-summary';
import { getDisplaySetGroups } from '@/src/features/workouts/set-display.utils';

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
  const latestSet = completedSets.at(-1);
  const setCountLabel = `${completedSets.length} ${
    completedSets.length === 1 ? 'set' : 'sets'
  }`;
  const displayGroups = getDisplaySetGroups(
    completedSets,
    {
      personalRecordSetIds
    },
    trackingType
  );
  const shouldShowSetDetails = displayGroups.length > 1;

  return (
    <View className={cn('gap-3', className)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
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
              {setCountLabel}
            </Text>
          ) : null}
        </View>

        {latestSet ? (
          <Text variant="small" className="text-foreground mt-6 font-medium">
            {formatTrackingValue(
              trackingType,
              getSetValues(latestSet),
              weightUnit
            )}
          </Text>
        ) : null}
      </View>

      {completedSets.length > 0 ? (
        shouldShowVolume ? (
          <Text variant="small" tone="muted">
            {formatWeightForUnit(exerciseVolume, weightUnit, {
              useGrouping: true,
              maximumFractionDigits: 0
            })}{' '}
            {weightUnit} total
          </Text>
        ) : null
      ) : emptyText ? (
        <Text variant="small" tone="muted">
          {emptyText}
        </Text>
      ) : null}

      {shouldShowSetDetails ? (
        <WorkoutSetSummary
          completedSets={completedSets}
          weightUnit={weightUnit}
          trackingType={trackingType}
          personalRecordSetIds={personalRecordSetIds}
        />
      ) : null}
    </View>
  );
}

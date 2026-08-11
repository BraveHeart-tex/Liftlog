import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { WorkoutExerciseSummary } from '@/src/features/workouts/components/workout-exercise-summary';
import { cn } from '@/src/lib/utils/cn.utils';
import { View } from 'react-native';

interface WorkoutHistoryExerciseCardProps {
  exerciseName: string;
  supersetLabel?: string;
  supersetRowLabel?: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
  className?: string;
  variant?: 'default' | 'grouped';
}

export const WorkoutHistoryExerciseCard = ({
  exerciseName,
  supersetLabel,
  supersetRowLabel,
  completedSets,
  weightUnit,
  trackingType,
  personalRecordSetIds,
  className,
  variant = 'default'
}: WorkoutHistoryExerciseCardProps) => {
  const isGrouped = variant === 'grouped';
  const summary = (
    <WorkoutExerciseSummary
      exerciseName={exerciseName}
      supersetLabel={isGrouped ? undefined : supersetLabel}
      completedSets={completedSets}
      weightUnit={weightUnit}
      trackingType={trackingType}
      personalRecordSetIds={personalRecordSetIds}
    />
  );

  if (isGrouped) {
    return (
      <View className={cn('flex-row items-start gap-3 px-3 py-3', className)}>
        <View className="bg-muted h-9 w-9 items-center justify-center rounded-full">
          <Text variant="bodyMedium" tone="muted">
            {supersetRowLabel}
          </Text>
        </View>
        <View className="min-w-0 flex-1">{summary}</View>
      </View>
    );
  }

  return (
    <Card className={cn('mt-3', className)}>
      <CardContent>{summary}</CardContent>
    </Card>
  );
};

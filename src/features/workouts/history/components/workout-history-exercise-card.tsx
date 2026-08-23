import { Card, CardContent } from '@/src/components/ui/card';
import type { Set } from '@/src/db';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { WorkoutExerciseSummary } from '@/src/features/workouts/shared/components/workout-exercise-summary';
import { cn } from '@/src/lib/utils/cn.utils';
import { View } from 'react-native';

interface WorkoutHistoryExerciseCardProps {
  exerciseName: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
  className?: string;
  variant?: 'default' | 'grouped';
}

export const WorkoutHistoryExerciseCard = ({
  exerciseName,
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
      completedSets={completedSets}
      weightUnit={weightUnit}
      trackingType={trackingType}
      personalRecordSetIds={personalRecordSetIds}
    />
  );

  if (isGrouped) {
    return <View className={cn('flex-1 py-3', className)}>{summary}</View>;
  }

  return (
    <Card className={cn('mt-3', className)}>
      <CardContent>{summary}</CardContent>
    </Card>
  );
};

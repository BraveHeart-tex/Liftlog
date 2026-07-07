import { Card, CardContent } from '@/src/components/ui/card';
import type { Set } from '@/src/db';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { WorkoutExerciseSummary } from '@/src/features/workouts/components/workout-exercise-summary';
import { cn } from '@/src/lib/utils/cn.utils';

interface WorkoutHistoryExerciseCardProps {
  exerciseName: string;
  supersetLabel?: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
  className?: string;
}

export const WorkoutHistoryExerciseCard = ({
  exerciseName,
  supersetLabel,
  completedSets,
  weightUnit,
  trackingType,
  personalRecordSetIds,
  className
}: WorkoutHistoryExerciseCardProps) => {
  return (
    <Card className={cn('mt-3', className)}>
      <CardContent>
        <WorkoutExerciseSummary
          exerciseName={exerciseName}
          supersetLabel={supersetLabel}
          completedSets={completedSets}
          weightUnit={weightUnit}
          trackingType={trackingType}
          personalRecordSetIds={personalRecordSetIds}
        />
      </CardContent>
    </Card>
  );
};

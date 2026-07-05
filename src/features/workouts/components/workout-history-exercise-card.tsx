import { Card, CardContent } from '@/src/components/ui/card';
import type { Set } from '@/src/db';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { WorkoutExerciseSummary } from '@/src/features/workouts/components/workout-exercise-summary';

interface WorkoutHistoryExerciseCardProps {
  exerciseName: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
}

export const WorkoutHistoryExerciseCard = ({
  exerciseName,
  completedSets,
  weightUnit,
  trackingType,
  personalRecordSetIds
}: WorkoutHistoryExerciseCardProps) => {
  return (
    <Card className="mt-3">
      <CardContent>
        <WorkoutExerciseSummary
          exerciseName={exerciseName}
          completedSets={completedSets}
          weightUnit={weightUnit}
          trackingType={trackingType}
          personalRecordSetIds={personalRecordSetIds}
        />
      </CardContent>
    </Card>
  );
};

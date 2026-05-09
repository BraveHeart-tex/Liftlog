import { Card, CardContent } from '@/src/components/ui/card';
import type { Set } from '@/src/db';
import type { WeightUnit } from '@/src/lib/utils/weight';
import { WorkoutExerciseSummary } from './workout-exercise-summary';

interface WorkoutHistoryExerciseCardProps {
  exerciseName: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  personalRecordSetIds?: ReadonlySet<string>;
}

export const WorkoutHistoryExerciseCard = ({
  exerciseName,
  completedSets,
  weightUnit,
  personalRecordSetIds
}: WorkoutHistoryExerciseCardProps) => {
  return (
    <Card className="mt-3">
      <CardContent>
        <WorkoutExerciseSummary
          exerciseName={exerciseName}
          completedSets={completedSets}
          weightUnit={weightUnit}
          personalRecordSetIds={personalRecordSetIds}
        />
      </CardContent>
    </Card>
  );
};

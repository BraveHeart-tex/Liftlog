import type { Set } from '@/src/db';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import { WorkoutExerciseSummaryContent } from '@/src/features/workouts/shared/components/workout-exercise-summary-content';
import { mapWorkoutExerciseSummary } from '@/src/features/workouts/shared/workout-exercise-summary.ui-model';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';

interface WorkoutExerciseSummaryProps {
  exerciseName: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType?: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
  emptyText?: string;
  className?: string;
}

export function WorkoutExerciseSummary({
  exerciseName,
  completedSets,
  weightUnit,
  trackingType = 'weight_reps',
  personalRecordSetIds,
  emptyText,
  className
}: WorkoutExerciseSummaryProps) {
  const summary = mapWorkoutExerciseSummary({
    exerciseName,
    completedSets,
    weightUnit,
    trackingType,
    personalRecordSetIds
  });

  return (
    <WorkoutExerciseSummaryContent
      {...summary}
      emptyText={emptyText}
      className={className}
    />
  );
}

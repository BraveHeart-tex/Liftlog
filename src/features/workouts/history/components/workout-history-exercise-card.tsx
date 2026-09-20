import { Card, CardContent } from '@/src/components/ui/card';
import type { WorkoutHistoryExerciseUiModel } from '@/src/features/workouts/history/workout-history.ui-model';
import { WorkoutExerciseSummaryContent } from '@/src/features/workouts/shared/components/workout-exercise-summary-content';
import { cn } from '@/src/lib/utils/cn.utils';
import { View } from 'react-native';

interface WorkoutHistoryExerciseCardProps {
  exercise: WorkoutHistoryExerciseUiModel;
  className?: string;
  variant?: 'default' | 'grouped';
}

export const WorkoutHistoryExerciseCard = ({
  exercise,
  className,
  variant = 'default'
}: WorkoutHistoryExerciseCardProps) => {
  const isGrouped = variant === 'grouped';
  const summary = <WorkoutExerciseSummaryContent {...exercise} />;

  if (isGrouped) {
    return <View className={cn('flex-1 py-3', className)}>{summary}</View>;
  }

  return (
    <Card className={cn('mt-3', className)}>
      <CardContent>{summary}</CardContent>
    </Card>
  );
};

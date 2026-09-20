import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { WorkoutHistoryExerciseUiModel } from '@/src/features/workouts/history/workout-history.ui-model';
import { cn } from '@/src/lib/utils/cn.utils';
import { View, type TextStyle } from 'react-native';

const tabularNumericStyle = {
  fontVariant: ['tabular-nums']
} satisfies TextStyle;

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
  const summary = (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="bodyMedium" numberOfLines={2}>
            {exercise.exerciseName}
          </Text>
          {exercise.setCountLabel ? (
            <Text variant="small" tone="muted" className="mt-0.5">
              {exercise.setCountLabel}
            </Text>
          ) : null}
        </View>

        {exercise.latestSetLabel ? (
          <Text variant="small" className="text-foreground mt-6 font-medium">
            {exercise.latestSetLabel}
          </Text>
        ) : null}
      </View>

      {exercise.volumeLabel ? (
        <Text variant="small" tone="muted">
          {exercise.volumeLabel}
        </Text>
      ) : null}

      {exercise.setRows.length > 0 ? (
        <View>
          {exercise.setRows.map((setRow, index) => {
            const isLast = index === exercise.setRows.length - 1;

            return (
              <View
                key={setRow.id}
                className={cn(
                  'flex-row items-center py-2',
                  !isLast && 'border-border border-b',
                  isLast && 'pb-0'
                )}
              >
                <Text
                  variant="small"
                  tone="muted"
                  className="w-12"
                  style={tabularNumericStyle}
                >
                  {setRow.positionLabel}
                </Text>
                <Text
                  variant="small"
                  className="text-foreground min-w-0 flex-1 text-right font-medium"
                  style={tabularNumericStyle}
                >
                  {setRow.valueLabel}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
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

import { Text } from '@/src/components/ui/text';
import type {
  WorkoutExerciseSummaryUiModel,
  WorkoutSetSummaryUiModel
} from '@/src/features/workouts/shared/workout-exercise-summary.ui-model';
import { cn } from '@/src/lib/utils/cn.utils';
import { View, type TextStyle } from 'react-native';

const tabularNumericStyle = {
  fontVariant: ['tabular-nums']
} satisfies TextStyle;

interface WorkoutExerciseSummaryContentProps extends WorkoutExerciseSummaryUiModel {
  emptyText?: string;
  className?: string;
}

export function WorkoutExerciseSummaryContent({
  exerciseName,
  setCountLabel,
  latestSetLabel,
  volumeLabel,
  setRows,
  emptyText,
  className
}: WorkoutExerciseSummaryContentProps) {
  return (
    <View className={cn('gap-3', className)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="bodyMedium" numberOfLines={2}>
            {exerciseName}
          </Text>
          {setCountLabel ? (
            <Text variant="small" tone="muted" className="mt-0.5">
              {setCountLabel}
            </Text>
          ) : null}
        </View>

        {latestSetLabel ? (
          <Text variant="small" className="text-foreground mt-6 font-medium">
            {latestSetLabel}
          </Text>
        ) : null}
      </View>

      {volumeLabel ? (
        <Text variant="small" tone="muted">
          {volumeLabel}
        </Text>
      ) : !setCountLabel && emptyText ? (
        <Text variant="small" tone="muted">
          {emptyText}
        </Text>
      ) : null}

      <WorkoutSetSummaryContent rows={setRows} />
    </View>
  );
}

interface WorkoutSetSummaryContentProps {
  rows: WorkoutSetSummaryUiModel[];
  emptyText?: string;
  className?: string;
  showDividers?: boolean;
}

export function WorkoutSetSummaryContent({
  rows,
  emptyText,
  className,
  showDividers = true
}: WorkoutSetSummaryContentProps) {
  return (
    <View className={className}>
      {rows.length > 0 ? (
        rows.map((setRow, index) => {
          const isLast = index === rows.length - 1;

          return (
            <View
              key={setRow.id}
              className={cn(
                'flex-row items-center py-2',
                showDividers && !isLast && 'border-border border-b',
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
              <View className="min-w-0 flex-1 flex-row items-center justify-end gap-2">
                {setRow.isPersonalRecord ? <PersonalRecordBadge /> : null}
                <Text
                  variant="small"
                  className="text-foreground min-w-0 text-right font-medium"
                  style={tabularNumericStyle}
                >
                  {setRow.valueLabel}
                </Text>
              </View>
            </View>
          );
        })
      ) : emptyText ? (
        <Text variant="small" tone="muted">
          {emptyText}
        </Text>
      ) : null}
    </View>
  );
}

function PersonalRecordBadge() {
  return (
    <View className="border-success bg-success/15 rounded-md border px-2 py-1">
      <Text variant="caption" className="text-success font-medium">
        PR
      </Text>
    </View>
  );
}

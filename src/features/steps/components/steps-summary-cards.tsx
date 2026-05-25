import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { HealthStepDay } from '@/src/db/schema';
import {
  formatStepWeekday,
  formatSteps,
  getStepAverageComparison,
  type StepAverageComparisonTone
} from '@/src/features/steps/display';
import { cn } from '@/src/lib/utils/cn';
import { View } from 'react-native';

interface StepsSummaryCardsProps {
  average7DaySteps: number;
  bestDay: HealthStepDay | null;
  todaySteps: number;
}

const comparisonToneClassNames: Record<StepAverageComparisonTone, string> = {
  danger: 'text-danger',
  muted: 'text-muted-foreground',
  success: 'text-success'
};

export function StepsSummaryCards({
  average7DaySteps,
  bestDay,
  todaySteps
}: StepsSummaryCardsProps) {
  const averageComparison = getStepAverageComparison(
    todaySteps,
    average7DaySteps
  );

  return (
    <View className="mt-4 flex-row gap-3">
      <Card className="flex-1">
        <CardContent className="px-4 py-3">
          <Text variant="small" tone="muted">
            vs 7-day avg
          </Text>
          <Text
            variant="h2"
            className={cn(
              'mt-2',
              comparisonToneClassNames[averageComparison.tone]
            )}
          >
            {averageComparison.percentLabel}
          </Text>
          <Text variant="caption" tone="muted" className="mt-1">
            {averageComparison.detail}
          </Text>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardContent className="px-4 py-3">
          <Text variant="small" tone="muted">
            best day
          </Text>
          <Text variant="h2" className="mt-2">
            {formatSteps(bestDay?.steps ?? 0)}
          </Text>
          <Text variant="caption" tone="muted" className="mt-1">
            {bestDay ? formatStepWeekday(bestDay.startAt) : 'No data'}
          </Text>
        </CardContent>
      </Card>
    </View>
  );
}

import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { HealthStepDay } from '@/src/db/schema';
import { formatSteps } from '@/src/features/steps/display';
import { cn } from '@/src/lib/utils/cn';
import { View } from 'react-native';

interface StepsSummaryCardsProps {
  average7DaySteps: number;
  bestDay: HealthStepDay | null;
  todaySteps: number;
}

function getAverageComparison(todaySteps: number, averageSteps: number) {
  if (averageSteps <= 0) {
    return {
      detail: 'No average yet',
      percentLabel: '0%',
      toneClassName: 'text-muted-foreground'
    };
  }

  const difference = todaySteps - averageSteps;
  const percent = Math.trunc((difference / averageSteps) * 100);
  const absoluteDifference = Math.abs(difference);

  if (difference > 0) {
    return {
      detail: `${formatSteps(absoluteDifference)} above average`,
      percentLabel: `+${percent}%`,
      toneClassName: 'text-success'
    };
  }

  if (difference < 0) {
    return {
      detail: `${formatSteps(absoluteDifference)} below average`,
      percentLabel: `${percent}%`,
      toneClassName: 'text-danger'
    };
  }

  return {
    detail: 'Same as average',
    percentLabel: '0%',
    toneClassName: 'text-muted-foreground'
  };
}

function formatWeekday(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(
    new Date(timestamp)
  );
}

export function StepsSummaryCards({
  average7DaySteps,
  bestDay,
  todaySteps
}: StepsSummaryCardsProps) {
  const averageComparison = getAverageComparison(todaySteps, average7DaySteps);

  return (
    <View className="mt-4 flex-row gap-3">
      <Card className="flex-1">
        <CardContent className="px-4 py-3">
          <Text variant="small" tone="muted">
            vs 7-day avg
          </Text>
          <Text
            variant="h2"
            className={cn('mt-2', averageComparison.toneClassName)}
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
            {bestDay ? formatWeekday(bestDay.startAt) : 'No data'}
          </Text>
        </CardContent>
      </Card>
    </View>
  );
}

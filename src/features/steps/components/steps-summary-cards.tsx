import { Text } from '@/src/components/ui/text';
import {
  formatStepWeekday,
  formatSteps
} from '@/src/features/steps/steps-display.utils';
import type { HealthStepDay } from '@/src/db/schema';
import { View } from 'react-native';

interface StepsSummaryCardsProps {
  averageSteps: number | null;
  bestDay: Pick<HealthStepDay, 'steps' | 'startAt'> | null;
  syncedDayCount: number;
  requiredDayCount: number;
}

export function StepsSummaryCards({
  averageSteps,
  bestDay,
  syncedDayCount,
  requiredDayCount
}: StepsSummaryCardsProps) {
  const hasFullWeek = averageSteps !== null && bestDay !== null;
  const incompleteWeekLabel = `${syncedDayCount}/${requiredDayCount} days synced`;

  return (
    <View className="border-border mt-6 flex-row border-y py-4">
      <View className="flex-1 pr-4">
        <Text variant="caption" tone="muted">
          7-day average
        </Text>
        <Text variant="h3" className="mt-1">
          {hasFullWeek ? formatSteps(averageSteps) : 'Not enough data'}
        </Text>
        <Text variant="caption" tone="muted" className="mt-1">
          {hasFullWeek ? 'steps / day' : incompleteWeekLabel}
        </Text>
      </View>

      <View className="border-border flex-1 border-l pl-4">
        <Text variant="caption" tone="muted">
          Best this week
        </Text>
        <Text variant="h3" className="mt-1">
          {hasFullWeek ? formatSteps(bestDay.steps) : 'Not enough data'}
        </Text>
        <Text variant="caption" tone="muted" className="mt-1">
          {hasFullWeek
            ? formatStepWeekday(bestDay.startAt)
            : incompleteWeekLabel}
        </Text>
      </View>
    </View>
  );
}

import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import {
  formatSteps,
  type StepRecentActivityStatus
} from '@/src/features/steps/steps-display.utils';
import { View } from 'react-native';

interface StepsSummaryCardsProps {
  recentActivityStatus: StepRecentActivityStatus;
  stepGoal: number;
}

export function StepsSummaryCards({
  recentActivityStatus,
  stepGoal
}: StepsSummaryCardsProps) {
  const averageSteps = recentActivityStatus.averageSteps;
  const goalPercent = recentActivityStatus.goalPercent;
  const hasRecentStatus = averageSteps !== null && goalPercent !== null;

  return (
    <View className="mt-6">
      <Card>
        <CardContent>
          <Text variant="small" tone="muted">
            Recent activity
          </Text>
          <Text variant="h2" className="mt-2">
            {hasRecentStatus
              ? `${formatSteps(averageSteps)} / day`
              : 'Not enough data'}
          </Text>
          <Text variant="caption" tone="muted" className="mt-1">
            {hasRecentStatus
              ? `${goalPercent}% of ${formatSteps(stepGoal)} goal`
              : `${recentActivityStatus.syncedDayCount}/${recentActivityStatus.requiredDayCount} recent days synced`}
          </Text>
          <Text variant="caption" tone="muted" className="mt-1">
            {recentActivityStatus.interpretation}
          </Text>
        </CardContent>
      </Card>
    </View>
  );
}

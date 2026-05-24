import { Text } from '@/src/components/ui/text';
import type { HealthStepDay } from '@/src/db/schema';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { View } from 'react-native';

interface StepDayRowProps {
  day: HealthStepDay;
  goal: number;
}

function formatSteps(steps: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0
  }).format(steps);
}

export function StepDayRow({ day, goal }: StepDayRowProps) {
  const progress = goal > 0 ? Math.min(100, (day.steps / goal) * 100) : 0;

  return (
    <View className="border-border bg-card mb-3 rounded-lg border p-4">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text variant="bodyMedium">{formatWorkoutDate(day.startAt)}</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            {Math.round(progress)}% of goal
          </Text>
        </View>

        <View className="items-end">
          <Text variant="h3">{formatSteps(day.steps)}</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            steps
          </Text>
        </View>
      </View>

      <View className="bg-muted mt-4 h-2 overflow-hidden rounded-sm">
        <View className="bg-primary h-full" style={{ width: `${progress}%` }} />
      </View>
    </View>
  );
}

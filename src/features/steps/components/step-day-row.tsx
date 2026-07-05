import { Text } from '@/src/components/ui/text';
import type { HealthStepDay } from '@/src/db/schema';
import {
  formatStepMonthDay,
  formatStepWeekday,
  formatSteps
} from '@/src/features/steps/steps-display.utils';
import { View } from 'react-native';

interface StepDayRowProps {
  day: HealthStepDay;
  goal: number;
}

export function StepDayRow({ day, goal }: StepDayRowProps) {
  const progress = goal > 0 ? Math.min(100, (day.steps / goal) * 100) : 0;

  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text variant="bodyMedium">{formatStepWeekday(day.startAt)}</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            {formatStepMonthDay(day.startAt)}
          </Text>
        </View>

        <View className="w-28 items-end">
          <Text variant="bodyMedium">{formatSteps(day.steps)}</Text>
          <View className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-sm">
            <View
              className="bg-primary h-full"
              style={{ width: `${progress}%` }}
            />
          </View>
          <Text variant="caption" tone="muted" className="mt-1">
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

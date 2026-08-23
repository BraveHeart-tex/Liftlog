import { Text } from '@/src/components/ui/text';
import type { HealthStepDay } from '@/src/db/schema';
import {
  formatStepMonthDay,
  formatStepWeekday,
  formatSteps
} from '@/src/features/steps/steps-display.utils';
import { View } from 'react-native';

interface StepDayRowProps {
  day: Pick<HealthStepDay, 'steps' | 'startAt'>;
  isToday?: boolean;
}

export function StepDayRow({ day, isToday = false }: StepDayRowProps) {
  return (
    <View className="border-border min-h-13 border-b py-2">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text variant="bodyMedium">
            {isToday ? 'Today' : formatStepWeekday(day.startAt)}
          </Text>
          <Text variant="caption" tone="muted" className="mt-1">
            {formatStepMonthDay(day.startAt)}
          </Text>
        </View>

        <View className="items-end">
          <Text variant="bodyMedium">{formatSteps(day.steps)}</Text>
        </View>
      </View>
    </View>
  );
}

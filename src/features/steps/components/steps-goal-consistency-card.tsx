import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { HealthStepDay } from '@/src/db/schema';
import { getTodayDateKey } from '@/src/features/steps/date';
import {
  formatSteps,
  getStepGoalConsistencyAverageSteps,
  getStepGoalConsistencyDays,
  getStepGoalConsistencyFillHeight,
  getStepGoalConsistencyHitCount,
  STEP_GOAL_CONSISTENCY_DAY_COUNT
} from '@/src/features/steps/display';
import { cn } from '@/src/lib/utils/cn';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

interface StepsGoalConsistencyCardProps {
  days: HealthStepDay[];
  goal: number;
}

const BAR_HEIGHT = 112;
const GOAL_HEIGHT_PERCENT = 72;

export function StepsGoalConsistencyCard({
  days,
  goal
}: StepsGoalConsistencyCardProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(getTodayDateKey);
  const consistencyDays = useMemo(
    () => getStepGoalConsistencyDays(days, goal),
    [days, goal]
  );
  const selectedDay =
    consistencyDays.find(day => day.dateKey === selectedDateKey) ??
    consistencyDays.at(-1);
  const averageSteps = getStepGoalConsistencyAverageSteps(consistencyDays);
  const hitCount = getStepGoalConsistencyHitCount(consistencyDays, goal);

  return (
    <Card className="mt-6">
      <CardContent>
        <View className="flex-row items-start justify-between gap-4">
          <Text variant="h3" className="flex-1">
            Goal consistency
          </Text>
          <View className="items-end">
            <Text variant="caption" tone="muted">
              7-day avg
            </Text>
            <Text variant="h2">{formatSteps(averageSteps)}</Text>
          </View>
        </View>

        <View className="mt-6">
          <View
            className="relative flex-row items-end justify-between"
            style={{ height: BAR_HEIGHT }}
          >
            <View
              className="border-muted-foreground/40 absolute right-0 left-0 border-t border-dashed"
              style={{ top: BAR_HEIGHT * (1 - GOAL_HEIGHT_PERCENT / 100) }}
            />

            {consistencyDays.map(day => (
              <PressableSurface
                key={day.dateKey}
                accessibilityLabel={`${day.dateLabel}, ${formatSteps(day.steps)} steps`}
                accessibilityState={{
                  selected: selectedDay?.dateKey === day.dateKey
                }}
                className="items-center"
                hapticFeedback="selection"
                pressedScale={0.96}
                onPress={() => setSelectedDateKey(day.dateKey)}
              >
                <View
                  className={cn(
                    'border-border bg-muted h-28 w-10 justify-end overflow-hidden rounded-md border',
                    (day.isToday || selectedDay?.dateKey === day.dateKey) &&
                      'border-primary border-2 bg-transparent'
                  )}
                >
                  <View
                    className={cn(
                      'w-full rounded-sm',
                      day.hit ? 'bg-primary' : 'bg-muted-foreground/25'
                    )}
                    style={{
                      height: getStepGoalConsistencyFillHeight({
                        barHeight: BAR_HEIGHT,
                        goalHeightPercent: GOAL_HEIGHT_PERCENT,
                        progress: day.progress
                      })
                    }}
                  />
                </View>
              </PressableSurface>
            ))}
          </View>

          <View className="mt-2 flex-row justify-between">
            {consistencyDays.map(day => (
              <View key={day.dateKey} className="w-10 items-center">
                <Text
                  variant="caption"
                  tone={
                    day.isToday || selectedDay?.dateKey === day.dateKey
                      ? 'success'
                      : 'muted'
                  }
                  className="text-center"
                >
                  {day.label}
                </Text>

                <View className="h-2 items-center justify-center">
                  {day.isToday ? (
                    <View className="bg-primary h-1.5 w-1.5 rounded-full" />
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          {selectedDay ? (
            <View className="bg-muted mt-3 flex-row items-center justify-between gap-4 rounded-md px-3 py-2">
              <Text variant="caption" tone="muted">
                {selectedDay.isToday ? 'Today' : selectedDay.dateLabel}
              </Text>
              <Text variant="bodyMedium">
                {formatSteps(selectedDay.steps)} steps
              </Text>
            </View>
          ) : null}

          <Text variant="small" tone="muted" className="mt-2">
            {hitCount}/{STEP_GOAL_CONSISTENCY_DAY_COUNT} days hit
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}

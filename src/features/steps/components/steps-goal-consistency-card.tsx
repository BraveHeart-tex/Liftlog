import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { HealthStepDay } from '@/src/db/schema';
import {
  getRecentLocalDayRanges,
  getTodayDateKey
} from '@/src/features/steps/date';
import { formatSteps } from '@/src/features/steps/display';
import { cn } from '@/src/lib/utils/cn';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

interface StepsGoalConsistencyCardProps {
  days: HealthStepDay[];
  goal: number;
}

interface GoalConsistencyDay {
  dateLabel: string;
  dateKey: string;
  hit: boolean;
  isToday: boolean;
  label: string;
  progress: number;
  steps: number;
}

const DAY_COUNT = 7;
const BAR_HEIGHT = 112;
const GOAL_HEIGHT_PERCENT = 72;

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.max(0, progress);
}

function getWeekdayLabel(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' })
    .format(new Date(timestamp))
    .slice(0, 1);
}

function getGoalConsistencyDays(
  days: HealthStepDay[],
  goal: number
): GoalConsistencyDay[] {
  const daysByDateKey = new Map(days.map(day => [day.dateKey, day]));
  const todayDateKey = getTodayDateKey();

  return getRecentLocalDayRanges(DAY_COUNT).map(range => {
    const day = daysByDateKey.get(range.dateKey);
    const steps = day?.steps ?? 0;
    const progress = goal > 0 ? normalizeProgress(steps / goal) : 0;

    return {
      dateKey: range.dateKey,
      dateLabel: formatWorkoutDate(range.startAt),
      hit: goal > 0 && steps >= goal,
      isToday: range.dateKey === todayDateKey,
      label: getWeekdayLabel(range.startAt),
      progress,
      steps
    };
  });
}

function getFillHeight(progress: number): number {
  return Math.min(
    BAR_HEIGHT,
    progress * BAR_HEIGHT * (GOAL_HEIGHT_PERCENT / 100)
  );
}

export function StepsGoalConsistencyCard({
  days,
  goal
}: StepsGoalConsistencyCardProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(getTodayDateKey);
  const consistencyDays = useMemo(
    () => getGoalConsistencyDays(days, goal),
    [days, goal]
  );
  const selectedDay =
    consistencyDays.find(day => day.dateKey === selectedDateKey) ??
    consistencyDays.at(-1);
  const averageSteps = Math.round(
    consistencyDays.reduce((total, day) => total + day.steps, 0) / DAY_COUNT
  );
  const hitCount = goal > 0 ? consistencyDays.filter(day => day.hit).length : 0;

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
                    style={{ height: getFillHeight(day.progress) }}
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
            {hitCount}/{DAY_COUNT} days hit
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}

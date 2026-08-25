import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { Text } from '@/src/components/ui/text';
import { ExerciseProgressChartBody } from '@/src/features/exercises/components/exercise-progress-chart-body';
import type { ExerciseProgressPoint } from '@/src/features/exercises/exercise.types';
import {
  formatScore,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { formatRollingProgression } from '@/src/features/workouts/active/exercise-history-format.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  MinusIcon
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

type ProgressRange = '1m' | '3m' | '6m' | '1y';

const PROGRESS_RANGE_OPTIONS: { label: string; value: ProgressRange }[] = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' }
];

const PROGRESS_RANGE_MONTHS: Record<ProgressRange, number> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '1y': 12
};

function getProgressRangeStart(range: ProgressRange) {
  const start = new Date();
  const dayOfMonth = start.getDate();
  start.setDate(1);
  start.setMonth(start.getMonth() - PROGRESS_RANGE_MONTHS[range]);
  start.setDate(
    Math.min(
      dayOfMonth,
      new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    )
  );

  return start.getTime();
}

function getChangeTone(delta: number | null) {
  if (delta === null || delta === 0) {
    return 'text-muted-foreground';
  }

  return delta > 0 ? 'text-progress-up' : 'text-progress-down';
}

function ChangeIcon({ delta }: { delta: number | null }) {
  const icon =
    delta === null || delta === 0
      ? MinusIcon
      : delta > 0
        ? ArrowUpRightIcon
        : ArrowDownRightIcon;
  const tone =
    delta === null || delta === 0
      ? 'mutedForeground'
      : delta > 0
        ? 'progressUp'
        : 'progressDown';

  return <Icon as={icon} size="sm" tone={tone} />;
}

interface ExerciseHistoryProgressionProps {
  points: ExerciseProgressPoint[];
  monthlyProgression: { delta: number } | null;
  latestPersonalRecord?: {
    score: number;
  };
  trackingType: TrackingType;
  weightUnit: WeightUnit;
  isLoading: boolean;
}

export function ExerciseHistoryProgression({
  points,
  monthlyProgression,
  latestPersonalRecord,
  trackingType,
  weightUnit,
  isLoading
}: ExerciseHistoryProgressionProps) {
  const [range, setRange] = useState<ProgressRange>('6m');
  const [selectedPoint, setSelectedPoint] =
    useState<ExerciseProgressPoint | null>(null);
  const displayedPoints = useMemo(() => {
    const rangeStart = getProgressRangeStart(range);

    return points.filter(point => point.date >= rangeStart);
  }, [points, range]);
  const latestPoint = points.at(-1);
  const progressionDelta = monthlyProgression?.delta ?? null;
  const previousPeriodScore =
    latestPoint && progressionDelta !== null
      ? latestPoint.value - progressionDelta
      : null;
  const changeLabel =
    progressionDelta === null
      ? 'No prior 30-day data'
      : formatRollingProgression(trackingType, progressionDelta, weightUnit);
  const handleRangeChange = useCallback((nextRange: ProgressRange) => {
    setSelectedPoint(null);
    setRange(nextRange);
  }, []);

  return (
    <View>
      <View className="mt-4 mb-2 min-h-11 flex-row items-center justify-end gap-3">
        <SegmentedControl
          value={range}
          options={PROGRESS_RANGE_OPTIONS}
          accessibilityMode="tabs"
          onChange={handleRangeChange}
          className="max-w-[228px] flex-1"
        />
      </View>

      <Card>
        <CardContent>
          {isLoading ? (
            <LoadingState
              label="Loading progress..."
              size="small"
              className="min-h-48 py-4"
            />
          ) : (
            <>
              <View className="flex-row items-start justify-between gap-4">
                <View className="min-w-0 flex-1">
                  <Text variant="caption" tone="muted">
                    Latest best score
                  </Text>
                  <Text variant="bodyMedium" className="mt-1">
                    {latestPoint?.valueLabel ?? 'No completed sets yet'}
                  </Text>
                </View>
                <View className="items-end">
                  <View className="flex-row items-center gap-1">
                    <ChangeIcon delta={progressionDelta} />
                    <Text
                      variant="caption"
                      className={getChangeTone(progressionDelta)}
                    >
                      {changeLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedPoint ? (
                <View className="mt-3 flex-row items-end justify-between gap-4">
                  <View className="min-w-0 flex-1">
                    <Text variant="caption" tone="muted">
                      Selected workout
                    </Text>
                    <Text
                      variant="bodyMedium"
                      className="mt-1"
                      numberOfLines={1}
                    >
                      {selectedPoint.valueLabel}
                    </Text>
                  </View>
                  <Text variant="caption" tone="muted">
                    {new Intl.DateTimeFormat(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    }).format(new Date(selectedPoint.date))}
                  </Text>
                </View>
              ) : null}

              {displayedPoints.length < 2 ? (
                <View className="border-border mt-4 min-h-40 items-center justify-center rounded-lg border border-dashed px-6">
                  <Text variant="bodyMedium" className="text-center">
                    Not enough data in this range
                  </Text>
                  <Text
                    variant="small"
                    tone="muted"
                    className="mt-2 text-center"
                  >
                    Log this exercise in two completed workouts during this
                    period to see a trend.
                  </Text>
                </View>
              ) : (
                <ExerciseProgressChartBody
                  points={displayedPoints}
                  weightUnit={weightUnit}
                  trackingType={trackingType}
                  onSelectedPointChange={setSelectedPoint}
                />
              )}

              <View className="border-border mt-4 flex-row border-t pt-3">
                <View className="min-w-0 flex-1 pr-3">
                  <Text variant="caption" tone="muted">
                    Latest PR
                  </Text>
                  <Text variant="small" className="mt-1" numberOfLines={1}>
                    {latestPersonalRecord
                      ? formatScore(
                          trackingType,
                          latestPersonalRecord.score,
                          weightUnit
                        )
                      : 'No PR yet'}
                  </Text>
                </View>
                <View className="border-border min-w-0 flex-1 border-l pl-3">
                  <Text variant="caption" tone="muted">
                    Prior 30 days
                  </Text>
                  <Text variant="small" className="mt-1" numberOfLines={1}>
                    {previousPeriodScore === null
                      ? 'No comparison'
                      : formatScore(
                          trackingType,
                          previousPeriodScore,
                          weightUnit
                        )}
                  </Text>
                </View>
              </View>
            </>
          )}
        </CardContent>
      </Card>
    </View>
  );
}

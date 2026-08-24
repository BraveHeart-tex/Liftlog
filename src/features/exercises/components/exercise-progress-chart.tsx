import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { Text } from '@/src/components/ui/text';
import { ExerciseProgressChartBody } from '@/src/features/exercises/components/exercise-progress-chart-body';
import type { ExerciseProgressPoint } from '@/src/features/exercises/exercise.types';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
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

interface ExerciseProgressChartProps {
  points: ExerciseProgressPoint[];
  weightUnit: WeightUnit;
  trackingType: TrackingType;
  isLoading?: boolean;
}

export function ExerciseProgressChart({
  points,
  weightUnit,
  trackingType,
  isLoading = false
}: ExerciseProgressChartProps) {
  const [range, setRange] = useState<ProgressRange>('3m');
  const displayedPoints = useMemo(() => {
    const rangeStart = getProgressRangeStart(range);

    return points.filter(point => point.date >= rangeStart);
  }, [points, range]);
  const handleRangeChange = useCallback(
    (nextRange: ProgressRange) => setRange(nextRange),
    []
  );

  return (
    <Card className="mt-6">
      <CardContent>
        {isLoading ? (
          <LoadingState
            label="Loading progress..."
            size="small"
            className="min-h-48 py-4"
          />
        ) : (
          <>
            <SegmentedControl
              value={range}
              options={PROGRESS_RANGE_OPTIONS}
              accessibilityMode="tabs"
              className="mb-4"
              onChange={handleRangeChange}
            />

            <View>
              <Text variant="bodyMedium">Progress over time</Text>
              <Text variant="small" tone="muted" className="mt-1">
                Best completed set score per workout.
              </Text>
            </View>

            {displayedPoints.length < 2 ? (
              <View className="border-border mt-4 min-h-40 items-center justify-center rounded-lg border border-dashed px-6">
                <Text variant="h3" className="text-center">
                  Not enough data in this range
                </Text>
                <Text variant="small" tone="muted" className="mt-2 text-center">
                  Log this exercise in two completed workouts during this period
                  to see a trend.
                </Text>
              </View>
            ) : (
              <ExerciseProgressChartBody
                points={displayedPoints}
                weightUnit={weightUnit}
                trackingType={trackingType}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

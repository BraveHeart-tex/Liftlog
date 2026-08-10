import { Card, CardContent } from '@/src/components/ui/card';
import { EmptyState } from '@/src/components/ui/empty-state';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Text } from '@/src/components/ui/text';
import { ExerciseProgressChartBody } from '@/src/features/exercises/components/exercise-progress-chart-body';
import type { ExerciseProgressPoint } from '@/src/features/exercises/exercise.types';
import {
  TRACKING_TYPE_DEFINITIONS,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { formatWorkoutDate } from '@/src/lib/utils/date.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

interface ExerciseProgressChartProps {
  points: ExerciseProgressPoint[];
  currentPerformance?: string;
  currentPerformanceDate?: number;
  weightUnit: WeightUnit;
  trackingType: TrackingType;
  isLoading?: boolean;
}

export function ExerciseProgressChart({
  points,
  currentPerformance,
  currentPerformanceDate,
  weightUnit,
  trackingType,
  isLoading = false
}: ExerciseProgressChartProps) {
  const [selectedPoint, setSelectedPoint] =
    useState<ExerciseProgressPoint | null>(null);
  const handleSelectedPointChange = useCallback(
    (point: ExerciseProgressPoint | null) => setSelectedPoint(point),
    []
  );
  const displayedValue = selectedPoint?.valueLabel ?? currentPerformance;
  const displayedDate = selectedPoint?.date ?? currentPerformanceDate;
  const hasCurrentPerformance = Boolean(
    currentPerformance && currentPerformanceDate
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
            {hasCurrentPerformance ? (
              <View>
                <Text variant="caption" tone="muted">
                  {selectedPoint
                    ? `Selected ${TRACKING_TYPE_DEFINITIONS[trackingType].scoreLabel}`
                    : 'Current performance'}
                </Text>

                <View className="mt-2 flex-row items-end justify-between gap-4">
                  <Text variant="bodyMedium" className="flex-1">
                    {displayedValue}
                  </Text>

                  {displayedDate ? (
                    <Text variant="caption" tone="muted">
                      {formatWorkoutDate(displayedDate)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            <View
              className={
                hasCurrentPerformance
                  ? 'border-border mt-4 border-t pt-4'
                  : undefined
              }
            >
              <Text variant="bodyMedium">Progress over time</Text>
              <Text variant="small" tone="muted" className="mt-1">
                Best completed set score per workout.
              </Text>
            </View>

            {points.length < 2 ? (
              <EmptyState
                kind="insufficient-data"
                layout="section"
                title="Not enough data yet"
                description="Log this exercise in two completed workouts to see a trend."
                className="border-border mt-4 min-h-40 rounded-lg border border-dashed"
              />
            ) : (
              <ExerciseProgressChartBody
                points={points}
                weightUnit={weightUnit}
                trackingType={trackingType}
                onSelectedPointChange={handleSelectedPointChange}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

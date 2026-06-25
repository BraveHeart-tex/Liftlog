import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Text } from '@/src/components/ui/text';
import { ExerciseProgressChartBody } from '@/src/features/exercises/components/exercise-progress-chart-body';
import type { ExerciseProgressPoint } from '@/src/features/exercises/exercise.types';
import type { TrackingType } from '@/src/features/progress/tracking';
import type { WeightUnit } from '@/src/lib/utils/weight';
import { View } from 'react-native';

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
  return (
    <Card className="mt-6">
      <CardContent>
        <View>
          <View className="flex-1">
            <Text variant="caption" tone="muted">
              Progress over time
            </Text>
            <Text variant="small" tone="muted" className="mt-2">
              Best completed set score per workout.
            </Text>
          </View>
        </View>

        {isLoading ? (
          <LoadingState
            label="Loading progress..."
            size="small"
            className="mt-5 min-h-48 py-4"
          />
        ) : points.length < 2 ? (
          <View className="border-border mt-5 min-h-48 items-center justify-center rounded-lg border border-dashed px-6">
            <Text variant="h3" className="text-center">
              Not enough data yet
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Log this exercise in two completed workouts to see a trend.
            </Text>
          </View>
        ) : (
          <ExerciseProgressChartBody
            points={points}
            weightUnit={weightUnit}
            trackingType={trackingType}
          />
        )}
      </CardContent>
    </Card>
  );
}

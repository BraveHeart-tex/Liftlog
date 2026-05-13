import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { ExerciseProgressPoint } from '@/src/features/exercises/hooks/use-exercise-detail';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { formatWeightForUnit, type WeightUnit } from '@/src/lib/utils/weight';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import {
  Circle,
  Line as SkiaLine,
  matchFont
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  CartesianChart,
  Line,
  Scatter,
  useChartPressState
} from 'victory-native';

interface ExerciseProgressChartProps {
  points: ExerciseProgressPoint[];
  weightUnit: WeightUnit;
}

type ChartPoint = Record<string, number> & {
  date: number;
  bestWeightKg: number;
};

function formatAxisDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp));
}

function getChartDomain(points: ExerciseProgressPoint[]) {
  const values = points.map(point => point.bestWeightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [Math.max(0, min - 5), max + 5] as [number, number];
  }

  const padding = Math.max((max - min) * 0.18, 2.5);

  return [Math.max(0, min - padding), max + padding] as [number, number];
}

export function ExerciseProgressChart({
  points,
  weightUnit
}: ExerciseProgressChartProps) {
  const { colors } = useAppTheme();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { state: pressState, isActive: isPressActive } = useChartPressState({
    x: points[0]?.date ?? 0,
    y: { bestWeightKg: points[0]?.bestWeightKg ?? 0 }
  });
  const axisFont = matchFont({ fontFamily: 'Inter', fontSize: 10 });
  const chartData: ChartPoint[] = points.map(point => ({
    date: point.date,
    bestWeightKg: point.bestWeightKg
  }));
  const latestPoint = points.at(-1);
  const selectedPoint =
    isPressActive && selectedIndex >= 0 ? points[selectedIndex] : latestPoint;

  useAnimatedReaction(
    () => pressState.matchedIndex.value,
    nextIndex => {
      scheduleOnRN(setSelectedIndex, nextIndex);
    },
    [pressState]
  );

  useEffect(() => {
    if (!isPressActive || selectedIndex < 0) {
      return;
    }

    void Haptics.selectionAsync();
  }, [isPressActive, selectedIndex]);

  return (
    <Card className="mt-6">
      <CardContent>
        <View>
          <View className="flex-1">
            <Text variant="caption" tone="muted">
              Progress over time
            </Text>
            <Text variant="small" tone="muted" className="mt-2">
              Best completed set weight per workout.
            </Text>
          </View>

          {selectedPoint ? (
            <View className="bg-muted mt-5 rounded-lg px-4 py-3">
              <View className="flex-row items-start justify-between gap-3">
                <View>
                  <Text variant="caption" tone="muted">
                    Date
                  </Text>
                  <Text variant="bodyMedium" className="mt-1">
                    {formatWorkoutDate(selectedPoint.date)}
                  </Text>
                </View>

                <View className="items-end">
                  <Text variant="caption" tone="muted">
                    Weight
                  </Text>
                  <Text variant="bodyMedium" className="text-primary mt-1">
                    {formatWeightForUnit(
                      selectedPoint.bestWeightKg,
                      weightUnit
                    )}{' '}
                    {weightUnit}
                  </Text>
                </View>
              </View>

              <Text variant="caption" tone="muted" className="mt-3">
                {isPressActive ? 'Selected point' : 'Latest point'}
              </Text>
            </View>
          ) : null}
        </View>

        {points.length < 2 ? (
          <View className="border-border mt-5 min-h-48 items-center justify-center rounded-lg border border-dashed px-6">
            <Text variant="h3" className="text-center">
              Not enough data yet
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Log this exercise in two completed workouts to see a trend.
            </Text>
          </View>
        ) : (
          <>
            <View className="mt-5 h-56">
              <CartesianChart<ChartPoint, 'date', 'bestWeightKg'>
                data={chartData}
                xKey="date"
                yKeys={['bestWeightKg']}
                chartPressState={pressState}
                domain={{ y: getChartDomain(points) }}
                domainPadding={{ left: 12, right: 12, top: 8, bottom: 4 }}
                padding={{ left: 2, right: 6, top: 8, bottom: 2 }}
                frame={{ lineColor: colors.border, lineWidth: 0 }}
                xAxis={{
                  font: axisFont,
                  formatXLabel: formatAxisDate,
                  labelColor: colors.mutedForeground,
                  lineColor: colors.border,
                  lineWidth: 1,
                  tickCount: 4
                }}
                yAxis={[
                  {
                    font: axisFont,
                    formatYLabel: value =>
                      `${formatWeightForUnit(Number(value), weightUnit)} ${weightUnit}`,
                    labelColor: colors.mutedForeground,
                    lineColor: colors.border,
                    lineWidth: 1,
                    tickCount: 4,
                    yKeys: ['bestWeightKg']
                  }
                ]}
              >
                {({ points: chartPoints, chartBounds }) => {
                  const selectedPoint =
                    isPressActive && selectedIndex >= 0
                      ? chartPoints.bestWeightKg[selectedIndex]
                      : undefined;

                  return (
                    <>
                      <Line
                        points={chartPoints.bestWeightKg}
                        color={colors.primary}
                        strokeWidth={2}
                        curveType="natural"
                        animate={{ type: 'timing', duration: 350 }}
                      />
                      <Scatter
                        points={chartPoints.bestWeightKg}
                        color={colors.primary}
                        radius={4.5}
                      />
                      {selectedPoint?.y ? (
                        <>
                          <SkiaLine
                            p1={{ x: selectedPoint.x, y: chartBounds.top }}
                            p2={{ x: selectedPoint.x, y: chartBounds.bottom }}
                            color={colors.mutedForeground}
                            strokeWidth={1}
                            opacity={0.35}
                          />
                          <Circle
                            cx={selectedPoint.x}
                            cy={selectedPoint.y}
                            r={8}
                            color={colors.card}
                          />
                          <Circle
                            cx={selectedPoint.x}
                            cy={selectedPoint.y}
                            r={5}
                            color={colors.primary}
                          />
                        </>
                      ) : null}
                    </>
                  );
                }}
              </CartesianChart>
            </View>

            <View className="mt-4 flex-row items-center gap-4">
              <View className="flex-row items-center gap-2">
                <View className="bg-primary h-2 w-2 rounded-full" />
                <Text variant="caption" tone="muted">
                  Best set weight
                </Text>
              </View>
            </View>
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { Text } from '@/src/components/ui/text';
import type { ExerciseProgressPoint } from '@/src/features/exercises/exercise.types';
import {
  TRACKING_TYPE_DEFINITIONS,
  formatScore,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { formatWorkoutDate } from '@/src/lib/utils/date.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { appFonts } from '@/src/theme/fonts';
import { nativeFontSizes } from '@/src/theme/sizes';
import {
  Circle,
  Line as SkiaLine,
  matchFont
} from '@shopify/react-native-skia';
import { selectionAsync } from 'expo-haptics';
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

interface ExerciseProgressChartBodyProps {
  points: ExerciseProgressPoint[];
  weightUnit: WeightUnit;
  trackingType: TrackingType;
}

type ChartPoint = Record<string, number> & {
  date: number;
  value: number;
};

const axisDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric'
});

function formatAxisDate(timestamp: number) {
  return axisDateFormatter.format(new Date(timestamp));
}

function getChartDomain(points: ExerciseProgressPoint[]) {
  const values = points.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [Math.max(0, min - 5), max + 5] as [number, number];
  }

  const padding = Math.max((max - min) * 0.18, 2.5);

  return [Math.max(0, min - padding), max + padding] as [number, number];
}

export function ExerciseProgressChartBody({
  points,
  weightUnit,
  trackingType
}: ExerciseProgressChartBodyProps) {
  const { colors } = useAppTheme();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { state: pressState, isActive: isPressActive } = useChartPressState({
    x: points[0]?.date ?? 0,
    y: { value: points[0]?.value ?? 0 }
  });
  const axisFont = matchFont({
    fontFamily: appFonts.family,
    fontSize: nativeFontSizes.chartAxis
  });
  const chartData: ChartPoint[] = points.map(point => ({
    date: point.date,
    value: point.value
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

    void selectionAsync();
  }, [isPressActive, selectedIndex]);

  return (
    <>
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
                {TRACKING_TYPE_DEFINITIONS[trackingType].scoreLabel}
              </Text>
              <Text variant="bodyMedium" className="text-primary mt-1">
                {selectedPoint.valueLabel}
              </Text>
            </View>
          </View>

          <Text variant="caption" tone="muted" className="mt-3">
            {isPressActive ? 'Selected point' : 'Latest point'}
          </Text>
        </View>
      ) : null}

      <View className="mt-5 h-56">
        <CartesianChart<ChartPoint, 'date', 'value'>
          data={chartData}
          xKey="date"
          yKeys={['value']}
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
                formatScore(trackingType, Number(value), weightUnit),
              labelColor: colors.mutedForeground,
              lineColor: colors.border,
              lineWidth: 1,
              tickCount: 4,
              yKeys: ['value']
            }
          ]}
        >
          {({ points: chartPoints, chartBounds }) => {
            const selectedChartPoint =
              isPressActive && selectedIndex >= 0
                ? chartPoints.value[selectedIndex]
                : undefined;

            return (
              <>
                <Line
                  points={chartPoints.value}
                  color={colors.primary}
                  strokeWidth={2}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 350 }}
                />
                <Scatter
                  points={chartPoints.value}
                  color={colors.primary}
                  radius={4.5}
                />
                {selectedChartPoint?.y ? (
                  <>
                    <SkiaLine
                      p1={{ x: selectedChartPoint.x, y: chartBounds.top }}
                      p2={{ x: selectedChartPoint.x, y: chartBounds.bottom }}
                      color={colors.mutedForeground}
                      strokeWidth={1}
                      opacity={0.35}
                    />
                    <Circle
                      cx={selectedChartPoint.x}
                      cy={selectedChartPoint.y}
                      r={8}
                      color={colors.card}
                    />
                    <Circle
                      cx={selectedChartPoint.x}
                      cy={selectedChartPoint.y}
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
            {TRACKING_TYPE_DEFINITIONS[trackingType].scoreLabel}
          </Text>
        </View>
      </View>
    </>
  );
}

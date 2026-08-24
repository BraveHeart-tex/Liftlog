import type { ExerciseProgressPoint } from '@/src/features/exercises/exercise.types';
import {
  formatScore,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { triggerHapticSelection } from '@/src/lib/haptics/haptics';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { appFontAssets, appFonts } from '@/src/theme/fonts';
import { nativeFontSizes } from '@/src/theme/sizes';
import { Circle, Line as SkiaLine, useFont } from '@shopify/react-native-skia';
import { useEffect, useRef, useState } from 'react';
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
  onSelectedPointChange: (point: ExerciseProgressPoint | null) => void;
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

function getChartDateTicks(points: ExerciseProgressPoint[]) {
  if (points.length < 3) {
    return points.map(point => point.date);
  }

  const middlePoint = points[Math.floor((points.length - 1) / 2)];

  return [points[0].date, middlePoint.date, points.at(-1)!.date];
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
  trackingType,
  onSelectedPointChange
}: ExerciseProgressChartBodyProps) {
  const { colors } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const lastHapticIndexRef = useRef(-1);
  const { state: pressState, isActive: isPressActive } = useChartPressState({
    x: points[0]?.date ?? 0,
    y: { value: points[0]?.value ?? 0 }
  });
  const axisFont = useFont(
    appFontAssets[appFonts.faces.regular],
    nativeFontSizes.chartAxis
  );
  const chartData: ChartPoint[] = points.map(point => ({
    date: point.date,
    value: point.value
  }));
  useAnimatedReaction(
    () => pressState.matchedIndex.value,
    nextIndex => {
      scheduleOnRN(setSelectedIndex, nextIndex);
    },
    [pressState]
  );

  useEffect(() => {
    if (!isPressActive) {
      lastHapticIndexRef.current = -1;
      onSelectedPointChange(null);

      return;
    }

    const selectedPoint = points[selectedIndex];

    if (!selectedPoint || lastHapticIndexRef.current === selectedIndex) {
      return;
    }

    lastHapticIndexRef.current = selectedIndex;
    onSelectedPointChange(selectedPoint);
    triggerHapticSelection('exercise progress point selection');
  }, [isPressActive, onSelectedPointChange, points, selectedIndex]);

  return (
    <View className="mt-4 h-56 w-full">
      <CartesianChart<ChartPoint, 'date', 'value'>
        data={chartData}
        xKey="date"
        yKeys={['value']}
        chartPressState={pressState}
        gestureLongPressDelay={250}
        domain={{ y: getChartDomain(points) }}
        domainPadding={{ left: 12, right: 12, top: 8, bottom: 4 }}
        padding={{ left: 0, right: 0, top: 8, bottom: 28 }}
        frame={{ lineColor: colors.border, lineWidth: 0 }}
        xAxis={{
          axisSide: 'bottom',
          font: axisFont,
          formatXLabel: formatAxisDate,
          labelColor: colors.mutedForeground,
          labelOffset: 8,
          lineColor: colors.border,
          lineWidth: 1,
          tickCount: 3,
          tickValues: getChartDateTicks(points),
          yAxisSide: 'left'
        }}
        yAxis={[
          {
            axisSide: 'left',
            font: axisFont,
            formatYLabel: value =>
              formatScore(trackingType, Number(value), weightUnit),
            labelColor: colors.mutedForeground,
            labelOffset: 8,
            labelPosition: 'outset',
            lineColor: colors.border,
            lineWidth: 1,
            tickCount: 5,
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
                animate={
                  reduceMotion ? undefined : { type: 'timing', duration: 350 }
                }
              />
              <Scatter
                points={chartPoints.value}
                color={colors.primary}
                radius={4.5}
                animate={
                  reduceMotion ? undefined : { type: 'timing', duration: 350 }
                }
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
  );
}

import type { ExerciseProgressPoint } from '@/src/features/exercises/exercise.types';
import {
  formatScore,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { triggerHapticSelection } from '@/src/lib/haptics/haptics';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { appFonts } from '@/src/theme/fonts';
import { nativeFontSizes } from '@/src/theme/sizes';
import {
  Circle,
  Line as SkiaLine,
  matchFont
} from '@shopify/react-native-skia';
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
  const { state: pressState, isActive: isPressActive } = useChartPressState({
    x: points[0]?.date ?? 0,
    y: { value: points[0]?.value ?? 0 }
  });
  const axisFont = matchFont({
    fontFamily: appFonts.faces.regular,
    fontSize: nativeFontSizes.chartAxis
  });
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
    if (!isPressActive || selectedIndex < 0) {
      onSelectedPointChange(null);

      return;
    }

    onSelectedPointChange(points[selectedIndex] ?? null);
    triggerHapticSelection('exercise progress point selection');
  }, [isPressActive, onSelectedPointChange, points, selectedIndex]);

  return (
    <View className="mt-4 h-48">
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
                animate={
                  reduceMotion ? undefined : { type: 'timing', duration: 350 }
                }
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
  );
}

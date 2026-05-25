import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { HealthStepDay } from '@/src/db/schema';
import { formatCompactSteps, formatSteps } from '@/src/features/steps/display';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { nativeFontSizes } from '@/src/theme/sizes';
import { matchFont } from '@shopify/react-native-skia';
import { View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

interface StepProgressChartProps {
  days: HealthStepDay[];
  goal: number;
}

type ChartPoint = Record<string, number> & {
  date: number;
  steps: number;
};

function formatAxisDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp));
}

function getChartDomain(days: HealthStepDay[], goal: number): [number, number] {
  const maxSteps = Math.max(goal, ...days.map(day => day.steps), 1000);

  return [0, Math.ceil(maxSteps * 1.15)];
}

export function StepProgressChart({ days, goal }: StepProgressChartProps) {
  const { colors } = useAppTheme();
  const axisFont = matchFont({
    fontFamily: 'Inter',
    fontSize: nativeFontSizes.chartAxis
  });
  const chartData: ChartPoint[] = days.slice(-14).map(day => ({
    date: day.startAt,
    steps: day.steps
  }));
  const latestDay = days.at(-1);

  return (
    <Card className="mt-6">
      <CardContent>
        <View>
          <Text variant="caption" tone="muted">
            Step trend
          </Text>
          <Text variant="small" tone="muted" className="mt-2">
            Last 14 days from Health Connect.
          </Text>
        </View>

        {chartData.length < 2 ? (
          <View className="border-border mt-5 min-h-48 items-center justify-center rounded-lg border border-dashed px-6">
            <Text variant="h3" className="text-center">
              Not enough step data
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Sync a few days from Health Connect to see your trend.
            </Text>
          </View>
        ) : (
          <>
            <View className="mt-5 h-56">
              <CartesianChart<ChartPoint, 'date', 'steps'>
                data={chartData}
                xKey="date"
                yKeys={['steps']}
                domain={{ y: getChartDomain(days, goal) }}
                domainPadding={{ left: 16, right: 16, top: 8, bottom: 4 }}
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
                    formatYLabel: value => formatCompactSteps(Number(value)),
                    labelColor: colors.mutedForeground,
                    lineColor: colors.border,
                    lineWidth: 1,
                    tickCount: 4,
                    yKeys: ['steps']
                  }
                ]}
              >
                {({ points, chartBounds }) => (
                  <Bar
                    points={points.steps}
                    chartBounds={chartBounds}
                    color={colors.primary}
                    roundedCorners={{
                      topLeft: 4,
                      topRight: 4
                    }}
                    animate={{ type: 'timing', duration: 350 }}
                  />
                )}
              </CartesianChart>
            </View>

            <View className="bg-muted mt-4 rounded-lg px-4 py-3">
              <View className="flex-row items-center justify-between gap-4">
                <Text variant="caption" tone="muted">
                  Latest
                </Text>
                <Text variant="bodyMedium">
                  {latestDay
                    ? `${formatSteps(latestDay.steps)} steps`
                    : 'No data'}
                </Text>
              </View>
              {latestDay ? (
                <Text variant="caption" tone="muted" className="mt-1">
                  {formatWorkoutDate(latestDay.startAt)}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </CardContent>
    </Card>
  );
}

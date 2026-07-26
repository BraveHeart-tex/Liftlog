import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { formatSteps } from '@/src/features/steps/steps-display.utils';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { cn } from '@/src/lib/utils/cn.utils';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { nativeFontSizes } from '@/src/theme/sizes';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface TodayStepRadialCardProps {
  compact?: boolean;
  steps: number;
  goal: number;
  progress: number;
  liveStepCounterBadgeLabel: string | null;
  liveStepCounterMessage: string | null;
  liveStepCounterStatus: string;
}

const CHART_SIZE = 236;
const COMPACT_CHART_SIZE = 156;
const STROKE_WIDTH = 15;
const COMPACT_STROKE_WIDTH = 10;
const MAX_SWEEP_DEGREES = 359.9;
const START_ANGLE_DEGREES = -90;

export function TodayStepRadialCard({
  compact = false,
  steps,
  goal,
  progress,
  liveStepCounterBadgeLabel,
  liveStepCounterMessage,
  liveStepCounterStatus
}: TodayStepRadialCardProps) {
  const { colors } = useAppTheme();

  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const progressEnd = useSharedValue(safeProgress / 100);
  const stepValue = useSharedValue(steps);
  const [displayedSteps, setDisplayedSteps] = useState(steps);
  const isLiveStepCounterActive = liveStepCounterStatus === 'active';
  const chartSize = compact ? COMPACT_CHART_SIZE : CHART_SIZE;
  const strokeWidth = compact ? COMPACT_STROKE_WIDTH : STROKE_WIDTH;
  const radius = (chartSize - strokeWidth) / 2;
  const center = chartSize / 2;
  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();

    path.addArc(
      {
        x: strokeWidth / 2,
        y: strokeWidth / 2,
        width: chartSize - strokeWidth,
        height: chartSize - strokeWidth
      },
      START_ANGLE_DEGREES,
      MAX_SWEEP_DEGREES
    );

    return path;
  }, [chartSize, strokeWidth]);

  useEffect(() => {
    progressEnd.value = withTiming(safeProgress / 100, {
      duration: MOTION_DURATION_MS.standard,
      easing: Easing.out(Easing.cubic)
    });
  }, [progressEnd, safeProgress]);

  useEffect(() => {
    stepValue.value = withTiming(steps, {
      duration: MOTION_DURATION_MS.standard,
      easing: Easing.out(Easing.cubic)
    });
  }, [stepValue, steps]);

  useAnimatedReaction(
    () => Math.round(stepValue.value),
    currentSteps => {
      runOnJS(setDisplayedSteps)(currentSteps);
    },
    []
  );

  return (
    <Card className={cn('overflow-hidden', compact ? 'mt-4' : 'mt-5')}>
      <CardContent className={compact ? 'px-4 py-4' : 'px-5 py-5'}>
        <View className="items-center">
          <View
            className="items-center justify-center"
            style={{ width: chartSize, height: chartSize }}
          >
            <View
              className="absolute"
              style={{ width: chartSize, height: chartSize }}
            >
              <Canvas style={{ width: chartSize, height: chartSize }}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  color={colors.border}
                  style="stroke"
                  strokeWidth={strokeWidth}
                />
                <Path
                  path={progressPath}
                  color={colors.primary}
                  style="stroke"
                  strokeWidth={strokeWidth}
                  strokeCap="round"
                  start={0}
                  end={progressEnd}
                />
              </Canvas>
            </View>

            <View className="w-44 items-center px-2">
              <Text
                variant="h1"
                className="text-center"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={{ fontSize: nativeFontSizes.stepRadialValueCompact }}
              >
                {formatSteps(displayedSteps)}
              </Text>

              <Text
                variant="bodyMedium"
                tone="muted"
                className="text-center"
                numberOfLines={1}
                style={{ fontSize: nativeFontSizes.stepRadialMeta }}
              >
                / {formatSteps(goal)} goal · {safeProgress}%
              </Text>

              <View className="flex w-full flex-row items-center justify-center">
                {liveStepCounterBadgeLabel ? (
                  <Badge
                    className={cn(
                      'mt-3 flex flex-row items-center',
                      isLiveStepCounterActive
                        ? 'bg-success/10 dark:bg-success/20'
                        : 'bg-secondary dark:bg-secondary/20'
                    )}
                  >
                    <View
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isLiveStepCounterActive
                          ? 'dark:bg-success bg-success/50'
                          : 'bg-secondary-foreground/50 dark:bg-secondary'
                      )}
                    />
                    <Text
                      variant="caption"
                      className={
                        isLiveStepCounterActive
                          ? 'text-success'
                          : 'text-secondary-foreground'
                      }
                    >
                      {liveStepCounterBadgeLabel}
                    </Text>
                  </Badge>
                ) : null}
              </View>
            </View>
          </View>

          {liveStepCounterMessage ? (
            <Text variant="caption" tone="muted" className="mt-4 text-center">
              {liveStepCounterMessage}
            </Text>
          ) : null}
        </View>
      </CardContent>
    </Card>
  );
}

import { Text } from '@/src/components/ui/text';
import { formatTime } from '@/src/lib/utils/format-time.utils';
import { cn } from '@/src/lib/utils/cn.utils';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { nativeFontSizes } from '@/src/theme/sizes';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface RestTimerCountdownProps {
  status: 'running' | 'paused';
  secondsRemaining: number;
  activeDuration: number;
}

const CHART_SIZE = 286;
const STROKE_WIDTH = 14;
const RADIUS = 119;
const CENTER = CHART_SIZE / 2;
const RING_INSET = CENTER - RADIUS;
const START_ANGLE_DEGREES = -90;
const MAX_SWEEP_DEGREES = 359.9;

function getSafeProgress(secondsRemaining: number, activeDuration: number) {
  if (activeDuration <= 0) {
    return 0;
  }

  return Math.min(Math.max(secondsRemaining / activeDuration, 0), 1);
}

export function RestTimerCountdown({
  status,
  secondsRemaining,
  activeDuration
}: RestTimerCountdownProps) {
  const { colors } = useAppTheme();
  const progress = getSafeProgress(secondsRemaining, activeDuration);
  const progressEnd = useSharedValue(progress);
  const ringColor = status === 'paused' ? colors.accent : colors.info;

  useEffect(() => {
    if (status !== 'running') {
      cancelAnimation(progressEnd);
      progressEnd.value = progress;

      return;
    }

    const nextProgress = getSafeProgress(
      Math.max(secondsRemaining - 1, 0),
      activeDuration
    );

    progressEnd.value = progress;
    progressEnd.value = withTiming(nextProgress, {
      duration: 1000,
      easing: Easing.linear
    });

    return () => {
      cancelAnimation(progressEnd);
    };
  }, [activeDuration, progress, progressEnd, secondsRemaining, status]);

  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();

    path.addArc(
      {
        x: RING_INSET,
        y: RING_INSET,
        width: RADIUS * 2,
        height: RADIUS * 2
      },
      START_ANGLE_DEGREES,
      MAX_SWEEP_DEGREES
    );

    return path;
  }, []);

  return (
    <View className="items-center">
      <View
        className="items-center justify-center"
        style={{ width: CHART_SIZE, height: CHART_SIZE }}
      >
        <View
          className="absolute"
          style={{ width: CHART_SIZE, height: CHART_SIZE }}
        >
          <Canvas style={{ width: CHART_SIZE, height: CHART_SIZE }}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              color={colors.border}
              style="stroke"
              strokeWidth={STROKE_WIDTH}
            />
            <Path
              path={progressPath}
              color={ringColor}
              style="stroke"
              strokeWidth={STROKE_WIDTH}
              strokeCap="round"
              start={0}
              end={progressEnd}
            />
          </Canvas>
        </View>

        <View className="w-[220px] items-center gap-1 px-2">
          <Text
            variant="caption"
            className={cn(
              'font-bold tracking-wider',
              status === 'paused' ? 'text-primary' : 'text-info'
            )}
          >
            {status === 'paused' ? 'PAUSED' : 'RESTING'}
          </Text>

          <Text
            variant="h2"
            className="text-foreground text-center font-semibold tracking-[-0.04em]"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{
              fontSize: nativeFontSizes.restTimerDisplay,
              fontVariant: ['tabular-nums']
            }}
          >
            {formatTime(secondsRemaining)}
          </Text>

          <Text
            variant="small"
            className="text-secondary-foreground text-center font-medium"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            of {formatTime(activeDuration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

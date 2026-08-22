import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import { formatTime } from '@/src/lib/utils/format-time.utils';
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
  /** Precise timestamp (ms since epoch) the timer will hit zero. Only meaningful while running. */
  endTime: number | null;
  /** Precise remaining ms captured at the moment the timer was paused. Only meaningful while paused. */
  pausedRemainingMs: number | null;
}

const CHART_SIZE = 286;
const STROKE_WIDTH = 14;
const RADIUS = 119;
const CENTER = CHART_SIZE / 2;
const RING_INSET = CENTER - RADIUS;
const START_ANGLE_DEGREES = -90;
const MAX_SWEEP_DEGREES = 359.9;

function getProgressFromMs({
  remainingMs,
  totalMs
}: {
  remainingMs: number;
  totalMs: number;
}) {
  if (totalMs <= 0) {
    return 0;
  }

  return Math.min(Math.max(remainingMs / totalMs, 0), 1);
}

function getCurrentRemainingMs({
  status,
  endTime,
  pausedRemainingMs
}: {
  status: 'running' | 'paused';
  endTime: number | null;
  pausedRemainingMs: number | null;
}) {
  if (status === 'running') {
    return Math.max(0, (endTime ?? Date.now()) - Date.now());
  }

  return Math.max(0, pausedRemainingMs ?? 0);
}

export function RestTimerCountdown({
  status,
  secondsRemaining,
  activeDuration,
  endTime,
  pausedRemainingMs
}: RestTimerCountdownProps) {
  const { colors } = useAppTheme();
  const totalMs = activeDuration * 1000;
  const ringColor = status === 'paused' ? colors.accent : colors.info;

  const progressEnd = useSharedValue(
    getProgressFromMs({
      remainingMs: getCurrentRemainingMs({
        status,
        endTime,
        pausedRemainingMs
      }),
      totalMs
    })
  );

  useEffect(() => {
    const remainingMs = getCurrentRemainingMs({
      status,
      endTime,
      pausedRemainingMs
    });
    const currentProgress = getProgressFromMs({ remainingMs, totalMs });

    cancelAnimation(progressEnd);
    // Always re-anchor to the exact, precisely-known progress for right
    // now. Since this is computed from real ms (not a rounded whole
    // second), it can never drift or "rewind" no matter how fast status
    // is toggled, and it self-corrects on every effect run.
    progressEnd.value = currentProgress;

    if (status === 'running' && remainingMs > 0) {
      progressEnd.value = withTiming(0, {
        duration: remainingMs,
        easing: Easing.linear
      });
    }

    return () => {
      cancelAnimation(progressEnd);
    };

    // secondsRemaining intentionally excluded: it's a rounded display
    // value that ticks every ~second and shouldn't restart the animation.
  }, [status, endTime, pausedRemainingMs, totalMs, progressEnd]);

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

        <View className="w-55 items-center gap-1 px-2">
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

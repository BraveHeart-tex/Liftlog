import { Badge } from '@/src/components/ui/badge';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { formatTime } from '@/src/lib/utils/format-time';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { nativeFontSizes } from '@/src/theme/sizes';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { PauseIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

interface RestTimerCountdownProps {
  status: 'running' | 'paused';
  secondsRemaining: number;
  activeDuration: number;
}

const CHART_SIZE = 236;
const STROKE_WIDTH = 14;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CENTER = CHART_SIZE / 2;
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
  const [displayedProgress, setDisplayedProgress] = useState(progress);
  const animationFrameRef = useRef<number | null>(null);
  const ringColor = status === 'paused' ? colors.accent : colors.info;

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (status !== 'running') {
      setDisplayedProgress(progress);

      return;
    }

    const nextProgress = getSafeProgress(
      Math.max(secondsRemaining - 1, 0),
      activeDuration
    );
    const startedAt = Date.now();

    setDisplayedProgress(progress);

    const animate = () => {
      const elapsedMs = Date.now() - startedAt;
      const animationProgress = Math.min(elapsedMs / 1000, 1);
      const interpolatedProgress =
        progress + (nextProgress - progress) * animationProgress;

      setDisplayedProgress(interpolatedProgress);

      if (animationProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeDuration, progress, secondsRemaining, status]);

  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();
    const sweep = displayedProgress * MAX_SWEEP_DEGREES;

    if (sweep <= 0) {
      return path;
    }

    path.addArc(
      {
        x: STROKE_WIDTH / 2,
        y: STROKE_WIDTH / 2,
        width: CHART_SIZE - STROKE_WIDTH,
        height: CHART_SIZE - STROKE_WIDTH
      },
      START_ANGLE_DEGREES,
      sweep
    );

    return path;
  }, [displayedProgress]);

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
              end={1}
            />
          </Canvas>
        </View>

        <View className="w-44 items-center px-2">
          {status === 'paused' ? (
            <View className="mb-4 w-full items-center justify-center">
              <Badge className="bg-accent/15 mx-auto px-3 py-1">
                <Icon icon={PauseIcon} size="sm" className="text-accent" />
                <Text variant="caption" className="text-accent font-semibold">
                  PAUSED
                </Text>
              </Badge>
            </View>
          ) : null}

          <Text
            className="text-foreground text-center font-medium"
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

          <Text variant="caption" tone="muted" className="mt-1 text-center">
            of {formatTime(activeDuration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

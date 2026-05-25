import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { formatSteps } from '@/src/features/steps/display';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { nativeFontSizes } from '@/src/theme/sizes';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';

interface TodayStepRadialCardProps {
  steps: number;
  goal: number;
  progress: number;
  liveStepCounterBadgeLabel: string | null;
  liveStepCounterMessage: string | null;
  liveStepCounterStatus: string;
}

const CHART_SIZE = 236;
const STROKE_WIDTH = 18;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CENTER = CHART_SIZE / 2;
const MAX_SWEEP_DEGREES = 359.9;
const START_ANGLE_DEGREES = -90;

export function TodayStepRadialCard({
  steps,
  goal,
  progress,
  liveStepCounterBadgeLabel,
  liveStepCounterMessage,
  liveStepCounterStatus
}: TodayStepRadialCardProps) {
  const { colors } = useAppTheme();

  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();
    const sweep = Math.max(0.1, (safeProgress / 100) * MAX_SWEEP_DEGREES);

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
  }, [safeProgress]);

  return (
    <Card className="mt-6 overflow-hidden">
      <CardContent className="px-5 py-7">
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
                  color={colors.primary}
                  style="stroke"
                  strokeWidth={STROKE_WIDTH}
                  strokeCap="round"
                  start={0}
                  end={1}
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
                style={{ fontSize: nativeFontSizes.stepRadialValue }}
              >
                {formatSteps(steps)}
              </Text>

              <Text
                variant="bodyMedium"
                tone="muted"
                className="mt-2 text-center"
                numberOfLines={1}
                style={{ fontSize: nativeFontSizes.stepRadialMeta }}
              >
                / {formatSteps(goal)} goal · {safeProgress}%
              </Text>

              {liveStepCounterBadgeLabel ? (
                <Badge
                  variant={
                    liveStepCounterStatus === 'active' ? 'success' : 'outline'
                  }
                  className="mt-4"
                >
                  {liveStepCounterBadgeLabel}
                </Badge>
              ) : null}
            </View>
          </View>

          {liveStepCounterMessage ? (
            <Text variant="caption" tone="muted" className="mt-5 text-center">
              {liveStepCounterMessage}
            </Text>
          ) : null}
        </View>
      </CardContent>
    </Card>
  );
}

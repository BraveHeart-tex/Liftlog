import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { RestTimerSheet } from '@/src/features/workouts/components/rest-timer-sheet';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer-store';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion';
import { cn } from '@/src/lib/utils/cn';
import { formatTime } from '@/src/lib/utils/format-time';
import { PauseIcon, TimerIcon } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

const ADD_TIME_SECONDS = 30;
const widgetEntering = FadeInDown.duration(MOTION_DURATION_MS.standard);
const widgetExiting = FadeOutUp.duration(MOTION_DURATION_MS.exit);

export function RestTimerWidget() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const status = useRestTimerStore(state => state.status);
  const secondsRemaining = useRestTimerStore(state => state.secondsRemaining);
  const addTime = useRestTimerStore(state => state.addTime);
  const cancelTimer = useRestTimerStore(state => state.cancel);
  const isPaused = status === 'paused';
  const pulseScale = useSharedValue(1);
  const timerLabel = formatTime(secondsRemaining, { padMinutes: true });
  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);
  const addThirtySeconds = useCallback(() => {
    addTime(ADD_TIME_SECONDS);
  }, [addTime]);

  useEffect(() => {
    if (status !== 'running') {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, {
        duration: MOTION_DURATION_MS.exit
      });

      return;
    }

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(pulseScale);
    };
  }, [pulseScale, status]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  return (
    <>
      {status !== 'idle' ? (
        <Animated.View
          className="px-4 pt-2 pb-3"
          entering={widgetEntering}
          exiting={widgetExiting}
        >
          <Animated.View
            className={cn(
              'border-info/30 bg-info/10 flex-row items-center gap-2 rounded-lg border p-2',
              isPaused && 'border-accent/30 bg-accent/10'
            )}
            style={pulseStyle}
          >
            <PressableSurface
              containerClassName="min-w-0 flex-1"
              className="min-h-12 flex-row items-center gap-3 rounded-md px-2"
              accessibilityLabel={`Open rest timer, ${timerLabel} ${
                isPaused ? 'paused' : 'remaining'
              }`}
              hapticFeedback="light"
              onPress={openSheet}
            >
              <View
                className={cn(
                  'bg-info/15 h-10 w-10 items-center justify-center rounded-full',
                  isPaused && 'bg-accent/15'
                )}
              >
                <Icon
                  as={isPaused ? PauseIcon : TimerIcon}
                  size="lg"
                  tone={isPaused ? 'accent' : 'info'}
                />
              </View>

              <View className="min-w-0 flex-1">
                <Text
                  variant="caption"
                  className={cn(
                    'text-info font-semibold',
                    isPaused && 'text-accent'
                  )}
                >
                  {isPaused ? 'Paused' : 'Rest'}
                </Text>
                <Text
                  variant="h3"
                  numberOfLines={1}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {timerLabel}
                </Text>
              </View>
            </PressableSurface>

            <Button
              variant="secondary"
              size="sm"
              className="min-h-10 px-2.5 py-2"
              textClassName="text-small"
              textStyle={{ fontVariant: ['tabular-nums'] }}
              accessibilityLabel="Add 30 seconds to rest timer"
              onPress={addThirtySeconds}
            >
              +30s
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="min-h-10 px-2.5 py-2"
              accessibilityLabel="Skip rest timer"
              textClassName="text-danger text-small"
              onPress={cancelTimer}
            >
              Skip
            </Button>
          </Animated.View>
        </Animated.View>
      ) : null}

      <RestTimerSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}

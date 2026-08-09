import { Button } from '@/src/components/ui/button';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { RestTimerSheet } from '@/src/features/workouts/components/rest-timer-sheet';
import { REST_TIMER_INCREMENT_SECONDS } from '@/src/features/workouts/rest-timer.constants';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { cn } from '@/src/lib/utils/cn.utils';
import { formatTime } from '@/src/lib/utils/format-time.utils';
import { useCallback, useEffect, useState } from 'react';
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

const widgetEntering = FadeInDown.duration(MOTION_DURATION_MS.standard);
const widgetExiting = FadeOutUp.duration(MOTION_DURATION_MS.exit);

interface RestTimerWidgetProps {
  className?: string;
}

export function RestTimerWidget({ className }: RestTimerWidgetProps) {
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
    addTime(REST_TIMER_INCREMENT_SECONDS);
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
          className={className}
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
              className="min-h-10 flex-row items-center gap-2 rounded-md px-2"
              accessibilityLabel={`Open rest timer, ${timerLabel} ${
                isPaused ? 'paused' : 'remaining'
              }`}
              hapticFeedback="light"
              onPress={openSheet}
            >
              <Text
                variant="bodyMedium"
                className={cn('text-info', isPaused && 'text-accent')}
                numberOfLines={1}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {isPaused ? 'Paused' : 'Rest'} {timerLabel}
              </Text>
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

      {isSheetOpen ? <RestTimerSheet isOpen onClose={closeSheet} /> : null}
    </>
  );
}

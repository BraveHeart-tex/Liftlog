import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { RestTimerCountdown } from '@/src/features/rest-timer/components/rest-timer-countdown';
import { REST_TIMER_INCREMENT_SECONDS } from '@/src/features/rest-timer/rest-timer.constants';
import { triggerRestTimerImpact } from '@/src/features/rest-timer/rest-timer.haptics';
import { useRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { PlayIcon, XIcon } from 'lucide-react-native';
import { View } from 'react-native';

export function RestTimerPausedContent() {
  const secondsRemaining = useRestTimerStore(state => state.secondsRemaining);
  const activeDuration = useRestTimerStore(
    state => state.activeDurationSeconds
  );
  const pausedRemainingMs = useRestTimerStore(state => state.pausedRemainingMs);
  const addTime = useRestTimerStore(state => state.addTime);
  const resumeTimer = useRestTimerStore(state => state.resume);
  const cancelTimer = useRestTimerStore(state => state.cancel);
  const canResume = secondsRemaining > 0;

  const handleResume = () => {
    triggerRestTimerImpact(
      ImpactFeedbackStyle.Medium,
      'Failed to trigger rest timer resume haptics'
    );
    resumeTimer();
  };

  const handleAddTime = () => {
    addTime(REST_TIMER_INCREMENT_SECONDS);
  };

  const handleCancel = () => {
    triggerRestTimerImpact(
      ImpactFeedbackStyle.Light,
      'Failed to trigger rest timer cancel haptics'
    );
    cancelTimer();
  };

  return (
    <View className="flex-1 items-center justify-between">
      <RestTimerCountdown
        status="paused"
        secondsRemaining={secondsRemaining}
        activeDuration={activeDuration}
        endTime={null}
        pausedRemainingMs={pausedRemainingMs}
      />

      <View className="w-full gap-2">
        <View className="w-full flex-row items-center gap-2.5">
          <View className="flex-1">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              textStyle={{ fontVariant: ['tabular-nums'] }}
              accessibilityLabel="Add 30 seconds to rest timer"
              onPress={handleAddTime}
            >
              +30 sec
            </Button>
          </View>
          <View className="flex-1">
            <Button
              size="lg"
              fullWidth
              disabled={!canResume}
              onPress={handleResume}
              leftIcon={
                <Icon as={PlayIcon} tone="primaryForeground" size="md" />
              }
            >
              Resume
            </Button>
          </View>
        </View>

        <Button
          variant="ghost"
          fullWidth
          textClassName="text-danger text-small"
          leftIcon={<Icon as={XIcon} tone="danger" size="sm" />}
          onPress={handleCancel}
        >
          End rest
        </Button>
      </View>
    </View>
  );
}

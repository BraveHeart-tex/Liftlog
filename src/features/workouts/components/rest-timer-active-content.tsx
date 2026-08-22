import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { RestTimerCountdown } from '@/src/features/workouts/components/rest-timer-countdown';
import { REST_TIMER_INCREMENT_SECONDS } from '@/src/features/workouts/rest-timer.constants';
import { triggerRestTimerImpact } from '@/src/features/workouts/rest-timer.haptics';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { PauseIcon, PlayIcon, XIcon } from 'lucide-react-native';
import { View } from 'react-native';

export function RestTimerActiveContent() {
  const status = useRestTimerStore(state => state.status);
  const secondsRemaining = useRestTimerStore(state => state.secondsRemaining);
  const activeDuration = useRestTimerStore(
    state => state.activeDurationSeconds
  );
  const endTime = useRestTimerStore(state => state.endTime);
  const pausedRemainingMs = useRestTimerStore(state => state.pausedRemainingMs);
  const addTime = useRestTimerStore(state => state.addTime);
  const pauseTimer = useRestTimerStore(state => state.pause);
  const resumeTimer = useRestTimerStore(state => state.resume);
  const cancelTimer = useRestTimerStore(state => state.cancel);
  const isPaused = status === 'paused';
  const canResume = secondsRemaining > 0;

  const handlePause = () => {
    triggerRestTimerImpact(
      ImpactFeedbackStyle.Medium,
      'Failed to trigger rest timer pause haptics'
    );
    pauseTimer();
  };

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
    <View className="flex-1 items-center justify-end gap-4">
      <RestTimerCountdown
        status={isPaused ? 'paused' : 'running'}
        secondsRemaining={secondsRemaining}
        activeDuration={activeDuration}
        endTime={endTime}
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
            {isPaused ? (
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
            ) : (
              <Button
                size="lg"
                fullWidth
                onPress={handlePause}
                leftIcon={
                  <Icon as={PauseIcon} tone="primaryForeground" size="md" />
                }
              >
                Pause
              </Button>
            )}
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

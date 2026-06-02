import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { RestTimerCountdown } from '@/src/features/workouts/components/rest-timer-countdown';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer-store';
import { iconSizes } from '@/src/theme/sizes';
import * as Haptics from 'expo-haptics';
import { PlayIcon } from 'lucide-react-native';
import { View } from 'react-native';

function triggerRestTimerImpact(
  style: Haptics.ImpactFeedbackStyle,
  errorMessage: string
) {
  Haptics.impactAsync(style).catch(error => {
    console.error(errorMessage, error);
  });
}

export function RestTimerPausedContent() {
  const secondsRemaining = useRestTimerStore(state => state.secondsRemaining);
  const activeDuration = useRestTimerStore(
    state => state.activeDurationSeconds
  );
  const resumeTimer = useRestTimerStore(state => state.resume);
  const cancelTimer = useRestTimerStore(state => state.cancel);
  const canResume = secondsRemaining > 0;

  const handleResume = () => {
    triggerRestTimerImpact(
      Haptics.ImpactFeedbackStyle.Medium,
      'Failed to trigger rest timer resume haptics'
    );
    resumeTimer();
  };

  const handleCancel = () => {
    triggerRestTimerImpact(
      Haptics.ImpactFeedbackStyle.Light,
      'Failed to trigger rest timer cancel haptics'
    );
    cancelTimer();
  };

  return (
    <>
      <RestTimerCountdown
        status="paused"
        secondsRemaining={secondsRemaining}
        activeDuration={activeDuration}
      />

      <View className="w-full flex-row gap-3">
        <View className="flex-1">
          <Button
            variant="destructive"
            className="w-full"
            onPress={handleCancel}
          >
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="secondary"
            className="w-full"
            disabled={!canResume}
            onPress={handleResume}
            leftIcon={
              <Icon
                icon={PlayIcon}
                className="text-secondary-foreground"
                size={iconSizes.md}
              />
            }
          >
            Resume
          </Button>
        </View>
      </View>
    </>
  );
}

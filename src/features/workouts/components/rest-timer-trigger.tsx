import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useIsRestTimerRunning } from '@/src/features/workouts/hooks/use-is-rest-timer-running';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer-store';
import { cn } from '@/src/lib/utils/cn';
import { formatTime } from '@/src/lib/utils/format-time';
import { PauseIcon, TimerIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface RestTimerTriggerProps {
  onPress: () => void;
}

export function RestTimerTrigger({ onPress }: RestTimerTriggerProps) {
  const restTimerStatus = useRestTimerStore(state => state.status);
  const isRestTimerRunning = useIsRestTimerRunning();
  const restTimerSecondsRemaining = useRestTimerStore(
    state => state.secondsRemaining
  );
  const isRestTimerPaused = restTimerStatus === 'paused';
  const restTimerLabel = formatTime(restTimerSecondsRemaining, {
    padMinutes: true
  });

  if (!isRestTimerRunning && !isRestTimerPaused) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onPress={onPress}
      >
        <Icon icon={TimerIcon} size="lg" tone="foreground" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      accessibilityLabel={`Rest timer ${restTimerLabel} ${
        isRestTimerPaused ? 'paused' : 'remaining'
      }`}
      className={cn(
        'bg-info/15 border-info/30 min-h-9 rounded-full px-3 py-1.5',
        isRestTimerPaused && 'bg-accent/15 border-accent/30'
      )}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-1.5">
        <Icon
          icon={isRestTimerPaused ? PauseIcon : TimerIcon}
          size="md"
          tone={isRestTimerPaused ? 'accent' : 'info'}
        />
        <Text
          variant="small"
          className={cn(
            'text-info font-semibold tabular-nums',
            isRestTimerPaused && 'text-accent'
          )}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {restTimerLabel}
        </Text>
      </View>
    </Button>
  );
}

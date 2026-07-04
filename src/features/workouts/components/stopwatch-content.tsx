import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import { formatDurationMs } from '@/src/lib/utils/format-time';
import { useAudioPlayer } from 'expo-audio';
import {
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SaveIcon
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StopwatchStatus = 'idle' | 'running' | 'paused';

interface StopwatchContentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (valueMs: number) => void;
}

export function StopwatchContent({
  isOpen,
  onClose,
  onConfirm
}: StopwatchContentProps) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<StopwatchStatus>('idle');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const startSoundPlayer = useAudioPlayer(
    require('@/assets/sounds/stopwatch-start.wav'),
    { downloadFirst: true }
  );
  const stopSoundPlayer = useAudioPlayer(
    require('@/assets/sounds/stopwatch-stop.wav'),
    { downloadFirst: true }
  );

  const getElapsedMs = (timestamp = Date.now()) => {
    if (status !== 'running' || startedAt === null) {
      return accumulatedMs;
    }

    return accumulatedMs + Math.max(0, timestamp - startedAt);
  };

  const elapsedMs = Math.round(getElapsedMs(now) / 10) * 10;
  const isRunning = status === 'running';
  const canReset = elapsedMs > 0;
  const canSave = elapsedMs >= 10;

  const playSound = async (
    player: typeof startSoundPlayer,
    errorMessage: string
  ) => {
    try {
      await player.seekTo(0);
      player.play();
    } catch (error) {
      console.error(errorMessage, error);
    }
  };

  const reset = () => {
    setStatus('idle');
    setStartedAt(null);
    setAccumulatedMs(0);
    setNow(Date.now());
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    void playSound(startSoundPlayer, 'Failed to play stopwatch start sound');
    setStartedAt(Date.now());
    setStatus('running');
  };

  const handlePause = () => {
    void playSound(stopSoundPlayer, 'Failed to play stopwatch stop sound');
    setAccumulatedMs(getElapsedMs());
    setStartedAt(null);
    setStatus('paused');
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    onConfirm(elapsedMs);
    reset();
    onClose();
  };

  return (
    <>
      <View className="items-center px-4 pt-2">
        <Text
          variant="h1"
          className="text-center text-[56px] leading-[64px]"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatDurationMs(elapsedMs)}
        </Text>
      </View>

      <View className="items-center px-4 pt-7">
        <Button
          className="h-32 w-32 rounded-full"
          variant={isRunning ? 'secondary' : 'primary'}
          accessibilityLabel={isRunning ? 'Pause stopwatch' : 'Start stopwatch'}
          onPress={isRunning ? handlePause : handleStart}
        >
          <View className="items-center justify-center gap-2">
            <Icon
              as={isRunning ? PauseIcon : PlayIcon}
              tone={isRunning ? 'secondaryForeground' : 'primaryForeground'}
              size={32}
            />
            <Text
              variant="bodyMedium"
              tone="inherit"
              className={cn(
                'font-semibold uppercase',
                isRunning
                  ? 'text-secondary-foreground'
                  : 'text-primary-foreground'
              )}
            >
              {isRunning ? 'Pause' : 'Start'}
            </Text>
          </View>
        </Button>
      </View>

      <View
        className="flex-row gap-3 px-4 pt-8"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-1">
          <Button
            variant="secondary"
            className="w-full"
            disabled={!canReset}
            leftIcon={
              <Icon
                as={RotateCcwIcon}
                tone={canReset ? 'secondaryForeground' : 'mutedForeground'}
                size="sm"
              />
            }
            onPress={reset}
          >
            Reset
          </Button>
        </View>
        <View className="flex-1">
          <Button
            className="w-full"
            disabled={!canSave}
            leftIcon={
              <Icon as={SaveIcon} tone={'primaryForeground'} size="sm" />
            }
            onPress={handleSave}
          >
            Save
          </Button>
        </View>
      </View>
    </>
  );
}

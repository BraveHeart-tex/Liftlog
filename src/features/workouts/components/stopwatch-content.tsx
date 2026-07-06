import { BottomSheetSafeFooter } from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { replaySoundEffect } from '@/src/lib/audio/replay-sound-effect.utils';
import { cn } from '@/src/lib/utils/cn.utils';
import { formatDurationMs } from '@/src/lib/utils/format-time.utils';
import { useAudioPlayer } from 'expo-audio';
import { RotateCcwIcon, SaveIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

type StopwatchStatus = 'idle' | 'running' | 'paused';

interface StopwatchContentProps {
  isOpen: boolean;
  defaultValueMs?: number;
  onClose: () => void;
  onConfirm: (valueMs: number) => void;
}

export function StopwatchContent({
  isOpen,
  defaultValueMs = 0,
  onClose,
  onConfirm
}: StopwatchContentProps) {
  const [status, setStatus] = useState<StopwatchStatus>('idle');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const isMountedRef = useRef(false);
  const isOpenRef = useRef(isOpen);

  isOpenRef.current = isOpen;

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
  const formattedElapsedTime = formatDurationMs(elapsedMs);
  const formattedDefaultTime = formatDurationMs(defaultValueMs);
  const primaryActionLabel = isRunning ? 'Tap to pause' : 'Tap to start';
  const accessibilityStatus =
    status === 'running' ? 'Running' : status === 'paused' ? 'Paused' : 'Idle';

  const playSound = async (
    player: typeof startSoundPlayer,
    errorMessage: string
  ) => {
    try {
      player.volume = 1;
      await replaySoundEffect(player, {
        shouldPlay: () => isMountedRef.current && isOpenRef.current
      });
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
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const handlePrimaryPress = () => {
    if (isRunning) {
      handlePause();

      return;
    }

    handleStart();
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
      <View className="px-4 pt-2">
        <PressableSurface
          accessibilityRole="button"
          accessibilityLabel={`${isRunning ? 'Pause' : 'Start'} stopwatch, ${formattedElapsedTime} elapsed`}
          accessibilityValue={{ text: accessibilityStatus }}
          className={cn(
            'min-h-52 w-full items-center justify-center gap-5 rounded-2xl border-2 px-5 py-9',
            isRunning
              ? 'border-accent/50 bg-accent/10'
              : 'border-primary/40 bg-primary/10'
          )}
          pressedClassName={isRunning ? 'bg-accent/15' : 'bg-primary/15'}
          pressedScale={0.98}
          onPress={handlePrimaryPress}
        >
          <Text
            variant="h1"
            className="text-center text-[56px] leading-[64px]"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formattedElapsedTime}
          </Text>
          <Text
            variant="small"
            tone="muted"
            className="text-center"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            Current {formattedDefaultTime}
          </Text>
          <Text
            variant="bodyMedium"
            className={cn(
              'text-center font-semibold uppercase',
              isRunning ? 'text-accent' : 'text-primary'
            )}
          >
            {primaryActionLabel}
          </Text>
        </PressableSurface>
      </View>

      <BottomSheetSafeFooter className="pb-safe-offset-4 pt-6">
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
      </BottomSheetSafeFooter>
    </>
  );
}

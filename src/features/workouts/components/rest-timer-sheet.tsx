import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { formatTime } from '@/src/lib/utils/format-time';
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { XIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text as NativeText, TextInput, View } from 'react-native';

const MIN_DURATION_SECONDS = 10;
const MAX_DURATION_SECONDS = 3600;
const DEFAULT_DURATION_SECONDS = 30;

export const timerRef = {
  endTime: null as number | null,
  pausedRemaining: null as number | null,
  durationSeconds: DEFAULT_DURATION_SECONDS,
  hasCompleted: false,
  isRunning: false
};

type RestTimerSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  durationSeconds?: number;
};

type TimerStatus = 'idle' | 'running' | 'paused';

function clampDuration(value: number) {
  return Math.max(MIN_DURATION_SECONDS, Math.min(MAX_DURATION_SECONDS, value));
}

function deriveStatus(): TimerStatus {
  if (timerRef.isRunning) {
    return 'running';
  }

  if (!timerRef.hasCompleted && timerRef.pausedRemaining !== null) {
    return 'paused';
  }

  return 'idle';
}

export function RestTimerSheet({
  isOpen,
  onClose,
  durationSeconds = 90
}: RestTimerSheetProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    Math.ceil(
      (timerRef.pausedRemaining ?? timerRef.durationSeconds * 1000) / 1000
    )
  );
  const [status, setStatus] = useState<TimerStatus>(() => deriveStatus());
  const [activeDuration, setActiveDuration] = useState(
    timerRef.durationSeconds
  );
  const [inputValue, setInputValue] = useState(timerRef.durationSeconds);
  const wasOpenRef = useRef(false);
  const statusRef = useRef(status);
  const player = useAudioPlayer(
    require('@/src/assets/sounds/rest-complete.mp3'),
    {
      downloadFirst: true,
      keepAudioSessionActive: true
    }
  );

  function getSecondsRemaining(): number {
    if (!timerRef.isRunning || timerRef.endTime === null) {
      return Math.ceil(
        (timerRef.pausedRemaining ?? timerRef.durationSeconds * 1000) / 1000
      );
    }

    return Math.max(0, Math.ceil((timerRef.endTime - Date.now()) / 1000));
  }

  function startTimer(totalSeconds: number) {
    timerRef.durationSeconds = totalSeconds;
    timerRef.endTime = Date.now() + totalSeconds * 1000;
    timerRef.pausedRemaining = null;
    timerRef.isRunning = true;
    timerRef.hasCompleted = false;

    setSecondsRemaining(totalSeconds);
    setStatus('running');
    setActiveDuration(totalSeconds);
    setInputValue(totalSeconds);
  }

  function setPausedInputValue(value: number) {
    setInputValue(value);

    if (status !== 'paused') {
      return;
    }

    const remaining = clampDuration(value);

    timerRef.pausedRemaining = remaining * 1000;
    setSecondsRemaining(remaining);
    setActiveDuration(remaining);
  }

  const playCompletionFeedback = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 200);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 400);

    try {
      await setIsAudioActiveAsync(true);
      await player.seekTo(0);
      player.volume = 1;
      player.play();
    } catch {
      // Sound file may be missing — haptics still work.
    }
  }, [player]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers'
    }).catch(() => {});
  }, []);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = getSecondsRemaining();

      setSecondsRemaining(remaining);

      if (timerRef.isRunning && remaining <= 0) {
        const shouldPlayCompletionFeedback = !timerRef.hasCompleted;

        timerRef.isRunning = false;
        timerRef.hasCompleted = true;
        timerRef.endTime = null;
        timerRef.pausedRemaining = null;

        const previousDuration = timerRef.durationSeconds;

        setSecondsRemaining(previousDuration);
        setActiveDuration(previousDuration);
        setInputValue(previousDuration);
        setStatus('idle');
        statusRef.current = 'idle';

        if (shouldPlayCompletionFeedback) {
          playCompletionFeedback();
        }

        return;
      }

      const nextStatus = deriveStatus();

      if (nextStatus !== statusRef.current) {
        statusRef.current = nextStatus;
        setStatus(nextStatus);

        if (nextStatus === 'idle') {
          setActiveDuration(timerRef.durationSeconds);
          setInputValue(timerRef.durationSeconds);
        }
      }
    }, 500);

    return () => clearInterval(id);
  }, [playCompletionFeedback]);

  useEffect(() => {
    if (durationSeconds && durationSeconds !== timerRef.durationSeconds) {
      if (!timerRef.isRunning && timerRef.pausedRemaining === null) {
        timerRef.durationSeconds = durationSeconds;
        timerRef.pausedRemaining = null;
        timerRef.hasCompleted = false;
        setActiveDuration(durationSeconds);
        setInputValue(durationSeconds);
        setSecondsRemaining(durationSeconds);
        setStatus('idle');
      }
    }
  }, [durationSeconds]);

  useEffect(() => {
    const didOpen = isOpen && !wasOpenRef.current;

    wasOpenRef.current = isOpen;

    if (!didOpen) {
      return;
    }

    const currentStatus = deriveStatus();
    const remaining = getSecondsRemaining();

    setSecondsRemaining(remaining);
    setStatus(currentStatus);
    setActiveDuration(
      currentStatus === 'paused' ? remaining : timerRef.durationSeconds
    );
    setInputValue(
      currentStatus === 'paused' ? remaining : timerRef.durationSeconds
    );
  }, [isOpen]);

  const handleInputChange = (value: string) => {
    if (value.trim().length === 0) {
      setInputValue(0);

      return;
    }

    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) {
      setInputValue(0);

      return;
    }

    const parsed = Number(digits);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInputValue(0);

      return;
    }

    setPausedInputValue(Math.min(MAX_DURATION_SECONDS, parsed));
  };

  const handleInputBlur = () => {
    if (!Number.isFinite(inputValue) || inputValue <= 0) {
      setPausedInputValue(DEFAULT_DURATION_SECONDS);

      return;
    }

    setPausedInputValue(clampDuration(inputValue));
  };

  const handleDecreaseInput = () => {
    setInputValue(current => {
      const next = Math.max(
        MIN_DURATION_SECONDS,
        current - MIN_DURATION_SECONDS
      );

      if (status === 'paused') {
        timerRef.pausedRemaining = next * 1000;
        setSecondsRemaining(next);
        setActiveDuration(next);
      }

      return next;
    });
  };

  const handleIncreaseInput = () => {
    setInputValue(current => {
      const next = Math.min(
        MAX_DURATION_SECONDS,
        current + MIN_DURATION_SECONDS
      );

      if (status === 'paused') {
        timerRef.pausedRemaining = next * 1000;
        setSecondsRemaining(next);
        setActiveDuration(next);
      }

      return next;
    });
  };

  const handleStart = () => {
    const clamped = clampDuration(inputValue);

    setInputValue(clamped);
    startTimer(clamped);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    timerRef.pausedRemaining = Math.max(0, timerRef.endTime! - Date.now());
    timerRef.isRunning = false;
    timerRef.endTime = null;

    const remaining = getSecondsRemaining();

    setSecondsRemaining(remaining);
    setInputValue(Math.ceil(remaining));
    setStatus('paused');
  };

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const resumeSeconds = clampDuration(
      status === 'paused' && timerRef.pausedRemaining !== null
        ? Math.ceil(timerRef.pausedRemaining / 1000)
        : inputValue
    );

    timerRef.endTime = Date.now() + resumeSeconds * 1000;
    timerRef.pausedRemaining = null;
    timerRef.isRunning = true;
    timerRef.hasCompleted = false;

    setInputValue(resumeSeconds);
    setSecondsRemaining(resumeSeconds);
    setActiveDuration(resumeSeconds);
    setStatus('running');
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    timerRef.isRunning = false;
    timerRef.hasCompleted = false;
    timerRef.endTime = null;
    timerRef.pausedRemaining = null;

    const original = timerRef.durationSeconds;

    setSecondsRemaining(original);
    setActiveDuration(original);
    setInputValue(original);
    setStatus('idle');
  };

  const handleClose = () => {
    onClose();
  };

  const showDurationInput = status === 'idle' || status === 'paused';
  const showCountdown = status === 'running';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={['55%']}
      enablePanDownToClose={false}
      className="flex-1"
    >
      <BottomSheetHeader className="flex-row items-center justify-between">
        <BottomSheetTitle>Rest</BottomSheetTitle>
        <Button variant="ghost" size="icon" onPress={handleClose}>
          <Icon icon={XIcon} size={20} className="text-foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="gap-6 px-4 pt-4 pb-6">
        {showDurationInput ? (
          <View>
            <Text variant="caption" tone="muted" className="mb-3">
              Rest duration
            </Text>

            <View className="flex-row items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="icon"
                disabled={inputValue <= MIN_DURATION_SECONDS}
                onPress={handleDecreaseInput}
              >
                <Text variant="h3">−</Text>
              </Button>

              <TextInput
                value={inputValue.toString()}
                onChangeText={handleInputChange}
                keyboardType="number-pad"
                style={{
                  fontSize: 20,
                  fontWeight: '500',
                  minWidth: 64,
                  textAlign: 'center'
                }}
                className="border-border text-foreground rounded-lg border px-3 py-2"
                onBlur={handleInputBlur}
                selectTextOnFocus
              />

              <Button
                variant="secondary"
                size="icon"
                onPress={handleIncreaseInput}
              >
                <Text variant="h3">+</Text>
              </Button>

              <Text variant="small" tone="muted">
                sec
              </Text>
            </View>
          </View>
        ) : null}

        {showCountdown ? (
          <View className="items-center">
            <NativeText
              className="text-foreground"
              style={{ fontSize: 72, fontWeight: '500' }}
            >
              {formatTime(secondsRemaining)}
            </NativeText>
            <Text variant="caption" tone="muted" className="mt-1 text-center">
              of {formatTime(activeDuration)}
            </Text>
          </View>
        ) : null}

        {status === 'idle' ? (
          <Button className="w-full" onPress={handleStart}>
            Start
          </Button>
        ) : null}

        {status === 'running' ? (
          <View className="w-full flex-row items-center gap-3">
            <View className="flex-1">
              <Button
                variant="secondary"
                className="w-full"
                onPress={handlePause}
              >
                Pause
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="destructive"
                className="w-full"
                onPress={handleCancel}
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : null}

        {status === 'paused' ? (
          <View className="w-full flex-row gap-3">
            <View className="flex-1">
              <Button
                variant="secondary"
                className="w-full"
                onPress={handleResume}
              >
                Resume
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="destructive"
                className="w-full"
                onPress={handleCancel}
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

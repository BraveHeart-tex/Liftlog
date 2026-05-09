import { StyledBottomSheetTextInput } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks';
import {
  MIN_REST_TIMER_SECONDS,
  useRestTimerStore
} from '@/src/features/workouts/stores/rest-timer-store';
import { formatTime } from '@/src/lib/utils/format-time';
import * as Haptics from 'expo-haptics';
import { XIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

interface RestTimerSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestTimerSheet({ isOpen, onClose }: RestTimerSheetProps) {
  /*
   * Approach:
   * 1. Keep timer state and math in the Zustand store.
   * 2. Keep this sheet responsible for rendering timer controls only.
   * 3. Let the app-level RestTimerHost drive ticking and completion feedback.
   */
  const { restTimerDuration: defaultDuration } = useSettings();
  const status = useRestTimerStore(state => state.status);
  const secondsRemaining = useRestTimerStore(state => state.secondsRemaining);
  const activeDuration = useRestTimerStore(
    state => state.activeDurationSeconds
  );
  const inputValue = useRestTimerStore(state => state.inputValue);
  const syncDefaultDuration = useRestTimerStore(
    state => state.syncDefaultDuration
  );
  const syncOnOpen = useRestTimerStore(state => state.syncOnOpen);
  const setSheetOpen = useRestTimerStore(state => state.setSheetOpen);
  const setInputFromText = useRestTimerStore(state => state.setInputFromText);
  const commitInput = useRestTimerStore(state => state.commitInput);
  const decreaseInput = useRestTimerStore(state => state.decreaseInput);
  const increaseInput = useRestTimerStore(state => state.increaseInput);
  const startTimer = useRestTimerStore(state => state.start);
  const pauseTimer = useRestTimerStore(state => state.pause);
  const resumeTimer = useRestTimerStore(state => state.resume);
  const cancelTimer = useRestTimerStore(state => state.cancel);
  const wasOpenRef = useRef(false);
  const registeredOpenRef = useRef(false);

  useEffect(() => {
    syncDefaultDuration(defaultDuration);
  }, [defaultDuration, syncDefaultDuration]);

  useEffect(() => {
    if (isOpen && !registeredOpenRef.current) {
      registeredOpenRef.current = true;
      setSheetOpen(true);
    }

    if (!isOpen && registeredOpenRef.current) {
      registeredOpenRef.current = false;
      setSheetOpen(false);
    }
  }, [isOpen, setSheetOpen]);

  useEffect(
    () => () => {
      if (registeredOpenRef.current) {
        registeredOpenRef.current = false;
        setSheetOpen(false);
      }
    },
    [setSheetOpen]
  );

  useEffect(() => {
    const didOpen = isOpen && !wasOpenRef.current;

    wasOpenRef.current = isOpen;

    if (!didOpen) {
      return;
    }

    syncOnOpen(defaultDuration);
  }, [defaultDuration, isOpen, syncOnOpen]);

  const handleInputChange = (value: string) => {
    setInputFromText(value);
  };

  const handleInputBlur = () => {
    commitInput(defaultDuration);
  };

  const handleDecreaseInput = () => {
    decreaseInput();
  };

  const handleIncreaseInput = () => {
    increaseInput();
  };

  const handleStart = () => {
    startTimer();
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(error => {
      console.error('Failed to trigger rest timer pause haptics', error);
    });
    pauseTimer();
  };

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(error => {
      console.error('Failed to trigger rest timer resume haptics', error);
    });
    resumeTimer();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(error => {
      console.error('Failed to trigger rest timer cancel haptics', error);
    });
    cancelTimer();
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
      enableDynamicSizing
      keyboardBehavior="interactive"
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
                disabled={inputValue <= MIN_REST_TIMER_SECONDS}
                onPress={handleDecreaseInput}
              >
                <Text variant="h3">-</Text>
              </Button>

              <StyledBottomSheetTextInput
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
                placeholderClassName="text-muted-foreground"
                selectionClassName="text-primary"
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
            <Text
              className="text-foreground text-[72px] font-medium"
              style={{
                fontVariant: ['tabular-nums']
              }}
            >
              {formatTime(secondsRemaining)}
            </Text>
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

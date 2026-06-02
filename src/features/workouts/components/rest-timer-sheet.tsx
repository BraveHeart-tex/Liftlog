import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import { useSettings } from '@/src/features/settings/hooks';
import { RestTimerCountdown } from '@/src/features/workouts/components/rest-timer-countdown';
import {
  MIN_REST_TIMER_SECONDS,
  useRestTimerStore
} from '@/src/features/workouts/stores/rest-timer-store';
import { getTimerParts } from '@/src/lib/utils/date';
import { iconSizes } from '@/src/theme/sizes';
import type { OnValueChanged } from '@quidone/react-native-wheel-picker';
import * as Haptics from 'expo-haptics';
import { PauseIcon, PlayIcon, XIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';

interface RestTimerSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const PICKER_ITEM_HEIGHT = 65;
const PICKER_VISIBLE_ITEM_COUNT = 3;

const minuteItems = Array.from({ length: 61 }, (_, value) => ({
  label: String(value),
  value
}));

const secondItems = Array.from({ length: 60 }, (_, value) => ({
  label: String(value).padStart(2, '0'),
  value
}));

export function RestTimerSheet({ isOpen, onClose }: RestTimerSheetProps) {
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
  const setInputDuration = useRestTimerStore(state => state.setInputDuration);
  const startTimer = useRestTimerStore(state => state.start);
  const pauseTimer = useRestTimerStore(state => state.pause);
  const resumeTimer = useRestTimerStore(state => state.resume);
  const cancelTimer = useRestTimerStore(state => state.cancel);
  const wasOpenRef = useRef(false);
  const registeredOpenRef = useRef(false);
  const { minutes, seconds } = getTimerParts(inputValue);

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

  const onMinuteChange: OnValueChanged<(typeof minuteItems)[number]> =
    useCallback(
      ({ item }) => {
        setInputDuration(item.value * 60 + seconds);
      },
      [seconds, setInputDuration]
    );

  const onSecondChange: OnValueChanged<(typeof secondItems)[number]> =
    useCallback(
      ({ item }) => {
        setInputDuration(minutes * 60 + item.value);
      },
      [minutes, setInputDuration]
    );

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

  const showDurationInput = status === 'idle';
  const showCountdown = status === 'running' || status === 'paused';
  const canStart = inputValue >= MIN_REST_TIMER_SECONDS;
  const canResume = inputValue > 0;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      keyboardBehavior="interactive"
      enableContentPanningGesture={false}
    >
      <BottomSheetHeader className="flex-row items-center justify-between">
        <BottomSheetTitle>Rest Timer</BottomSheetTitle>
        <Button variant="ghost" size="icon" onPress={handleClose}>
          <Icon icon={XIcon} size="lg" className="text-foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="gap-6 px-4 pt-4 pb-6">
        {showDurationInput ? (
          <View className="items-center">
            <View className="-mt-4 flex-row items-center justify-center">
              <View className="relative w-32">
                <WheelPicker
                  data={minuteItems}
                  value={minutes}
                  onValueChanged={onMinuteChange}
                  visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
                  itemHeight={PICKER_ITEM_HEIGHT}
                  width="100%"
                  overlayItemClassName="rounded-xl border border-border bg-secondary/40"
                  itemTextClassName="text-4xl font-semibold tabular-nums"
                />
                <View
                  pointerEvents="none"
                  className="absolute top-0 right-3 bottom-0 z-10 justify-center"
                >
                  <Text
                    variant="overline"
                    tone="muted"
                    className="text-[10px] font-bold"
                  >
                    MIN
                  </Text>
                </View>
              </View>

              <View className="w-8 items-center justify-center">
                <Text
                  variant="h2"
                  tone="muted"
                  className="pb-1 text-center font-semibold"
                >
                  :
                </Text>
              </View>

              <View className="relative w-32">
                <WheelPicker
                  data={secondItems}
                  value={seconds}
                  onValueChanged={onSecondChange}
                  visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
                  itemHeight={PICKER_ITEM_HEIGHT}
                  width="100%"
                  overlayItemClassName="rounded-xl border border-border bg-secondary/40"
                  itemTextClassName="text-4xl font-semibold tabular-nums"
                />
                <View
                  pointerEvents="none"
                  className="absolute top-0 right-3 bottom-0 z-10 justify-center"
                >
                  <Text
                    variant="overline"
                    tone="muted"
                    className="text-[10px] font-bold"
                  >
                    SEC
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {showCountdown ? (
          <RestTimerCountdown
            status={status}
            secondsRemaining={secondsRemaining}
            activeDuration={activeDuration}
          />
        ) : null}

        {status === 'idle' ? (
          <Button className="w-full" disabled={!canStart} onPress={handleStart}>
            Start
          </Button>
        ) : null}

        {status === 'running' ? (
          <View className="w-full flex-row items-center gap-3">
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
                onPress={handlePause}
                leftIcon={
                  <Icon
                    icon={PauseIcon}
                    className="text-secondary-foreground"
                    size={iconSizes.md}
                  />
                }
              >
                Pause
              </Button>
            </View>
          </View>
        ) : null}

        {status === 'paused' ? (
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
        ) : null}
      </View>
    </BottomSheet>
  );
}

import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import type {
  OnValueChanged,
  OnValueChanging
} from '@quidone/react-native-wheel-picker';

import { SaveIcon, XIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

const PICKER_ITEM_HEIGHT = 65;
const PICKER_VISIBLE_ITEM_COUNT = 3;
const MIN_REST_TIMER_SECONDS = 10;

const minuteItems = Array.from({ length: 11 }, (_, value) => ({
  label: String(value),
  value
}));

const secondItems = Array.from({ length: 60 }, (_, value) => ({
  label: String(value).padStart(2, '0'),
  value
}));

export const RestTimerSettingSheet = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={['36%']}
      keyboardBehavior="extend"
      enableContentPanningGesture={false}
    >
      {({ isContentReady }) => (
        <RestTimerSettingSheetContent
          isOpen={isOpen}
          onClose={handleClose}
          renderWheels={isContentReady}
        />
      )}
    </BottomSheet>
  );
};

const RestTimerSettingSheetContent = memo(
  function RestTimerSettingSheetContent({
    isOpen,
    onClose,
    renderWheels
  }: {
    isOpen: boolean;
    onClose: () => void;
    renderWheels: boolean;
  }) {
    const { restTimerDuration, setRestTimerDuration } = useSettings();
    const [minutes, setMinutes] = useState(
      () => getTimerParts(restTimerDuration).minutes
    );
    const [seconds, setSeconds] = useState(
      () => getTimerParts(restTimerDuration).seconds
    );
    const minutesRef = useRef(getTimerParts(restTimerDuration).minutes);
    const secondsRef = useRef(getTimerParts(restTimerDuration).seconds);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const nextTimer = getTimerParts(restTimerDuration);

      minutesRef.current = nextTimer.minutes;
      secondsRef.current = nextTimer.seconds;
      setMinutes(nextTimer.minutes);
      setSeconds(nextTimer.seconds);
    }, [isOpen, restTimerDuration]);

    const totalSeconds = minutes * 60 + seconds;
    const canSave = totalSeconds >= MIN_REST_TIMER_SECONDS;

    const handleSave = () => {
      const selectedTotalSeconds = minutesRef.current * 60 + secondsRef.current;

      if (selectedTotalSeconds < MIN_REST_TIMER_SECONDS) {
        return;
      }

      setRestTimerDuration(selectedTotalSeconds);
      onClose();
    };

    const handleClose = () => {
      onClose();
    };

    const onMinuteChanging: OnValueChanging<(typeof minuteItems)[number]> =
      useCallback(({ item }) => {
        minutesRef.current = item.value;
      }, []);

    const onMinuteChange: OnValueChanged<(typeof minuteItems)[number]> =
      useCallback(({ item }) => {
        minutesRef.current = item.value;
        setMinutes(item.value);
      }, []);

    const onSecondChanging: OnValueChanging<(typeof secondItems)[number]> =
      useCallback(({ item }) => {
        secondsRef.current = item.value;
      }, []);

    const onSecondChange: OnValueChanged<(typeof secondItems)[number]> =
      useCallback(({ item }) => {
        secondsRef.current = item.value;
        setSeconds(item.value);
      }, []);

    return (
      <>
        <BottomSheetHeader className="flex-row items-center justify-between">
          <BottomSheetTitle>Rest Timer</BottomSheetTitle>
          <Button
            variant="secondary"
            size="icon"
            onPress={handleClose}
            accessibilityLabel="Close rest timer sheet"
            className="px-0"
          >
            <Icon as={XIcon} size="lg" tone="foreground" />
          </Button>
        </BottomSheetHeader>

        <View className="flex-col items-center px-4">
          <View className="-mt-4 flex-row items-center justify-center">
            <View className="relative w-32">
              <WheelPicker
                data={minuteItems}
                value={minutes}
                onValueChanging={onMinuteChanging}
                onValueChanged={onMinuteChange}
                renderWhen={renderWheels}
                visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
                itemHeight={PICKER_ITEM_HEIGHT}
                width="100%"
                overlayItemClassName="rounded-xl border border-border bg-secondary/40"
                itemTextClassName="text-4xl font-semibold"
                itemTextStyle={{ fontVariant: ['tabular-nums'] }}
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
                onValueChanging={onSecondChanging}
                onValueChanged={onSecondChange}
                renderWhen={renderWheels}
                visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
                itemHeight={PICKER_ITEM_HEIGHT}
                width="100%"
                overlayItemClassName="rounded-xl border border-border bg-secondary/40"
                itemTextClassName="text-4xl font-semibold"
                itemTextStyle={{ fontVariant: ['tabular-nums'] }}
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
          <Button
            className="w-full"
            disabled={!canSave}
            leftIcon={<Icon as={SaveIcon} tone="primaryForeground" />}
            onPress={handleSave}
          >
            Save
          </Button>
        </View>
      </>
    );
  }
);

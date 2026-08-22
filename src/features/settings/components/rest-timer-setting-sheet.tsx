import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import { SaveIcon, XIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { DrumPickerProps } from 'react-native-drum-picker';
import { View } from 'react-native';

const PICKER_ITEM_HEIGHT = 65;
const PICKER_VISIBLE_ITEM_COUNT = 3;
const MIN_REST_TIMER_SECONDS = 10;

const minuteItems = Array.from({ length: 11 }, (_, value) => String(value));

const secondItems = Array.from({ length: 60 }, (_, value) =>
  String(value).padStart(2, '0')
);

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
      snapPoints={['44%']}
      keyboardBehavior="extend"
      enableContentPanningGesture={false}
    >
      <RestTimerSettingSheetContent isOpen={isOpen} onClose={handleClose} />
    </BottomSheet>
  );
};

const RestTimerSettingSheetContent = memo(
  function RestTimerSettingSheetContent({
    isOpen,
    onClose
  }: {
    isOpen: boolean;
    onClose: () => void;
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

      try {
        setRestTimerDuration(selectedTotalSeconds);
        onClose();
      } catch (error) {
        console.error('Failed to save rest timer duration', error);
        showSnackbar({
          message: 'Could not save rest timer. Please try again.',
          variant: 'danger'
        });
      }
    };

    const handleClose = () => {
      onClose();
    };

    const onMinuteChanging = useCallback<
      NonNullable<DrumPickerProps['onValueChanging']>
    >(({ nativeEvent }) => {
      minutesRef.current = nativeEvent.index;
    }, []);

    const onMinuteChange = useCallback<
      NonNullable<DrumPickerProps['onChange']>
    >(({ nativeEvent }) => {
      minutesRef.current = nativeEvent.index;
      setMinutes(nativeEvent.index);
    }, []);

    const onSecondChanging = useCallback<
      NonNullable<DrumPickerProps['onValueChanging']>
    >(({ nativeEvent }) => {
      secondsRef.current = nativeEvent.index;
    }, []);

    const onSecondChange = useCallback<
      NonNullable<DrumPickerProps['onChange']>
    >(({ nativeEvent }) => {
      secondsRef.current = nativeEvent.index;
      setSeconds(nativeEvent.index);
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
              <View
                pointerEvents="none"
                className="border-border bg-secondary/40 absolute inset-x-0 top-[65px] h-[65px] rounded-xl border"
              />
              <WheelPicker
                items={minuteItems}
                selectedIndex={minutes}
                onValueChanging={onMinuteChanging}
                onChange={onMinuteChange}
                visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
                itemHeight={PICKER_ITEM_HEIGHT}
                textSize={32}
                selectedTextSize={36}
                style={{
                  width: '100%',
                  height: PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ITEM_COUNT
                }}
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
              <View
                pointerEvents="none"
                className="border-border bg-secondary/40 absolute inset-x-0 top-[65px] h-[65px] rounded-xl border"
              />
              <WheelPicker
                items={secondItems}
                selectedIndex={seconds}
                onValueChanging={onSecondChanging}
                onChange={onSecondChange}
                visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
                itemHeight={PICKER_ITEM_HEIGHT}
                textSize={32}
                selectedTextSize={36}
                style={{
                  width: '100%',
                  height: PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ITEM_COUNT
                }}
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
            fullWidth
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

import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import { cn } from '@/src/lib/utils/cn.utils';
import type { DrumPickerProps } from 'react-native-drum-picker';
import { View } from 'react-native';

const PICKER_ITEM_HEIGHT = 65;
const PICKER_VISIBLE_ITEM_COUNT = 3;

const minuteItems = Array.from({ length: 61 }, (_, value) => String(value));

const secondItems = Array.from({ length: 60 }, (_, value) =>
  String(value).padStart(2, '0')
);

interface RestTimerDurationPickerProps {
  minutes: number;
  seconds: number;
  className?: string;
  onMinutesChanging: (value: number) => void;
  onMinutesChange: (value: number) => void;
  onSecondsChanging: (value: number) => void;
  onSecondsChange: (value: number) => void;
}

export function RestTimerDurationPicker({
  minutes,
  seconds,
  className,
  onMinutesChanging,
  onMinutesChange,
  onSecondsChanging,
  onSecondsChange
}: RestTimerDurationPickerProps) {
  const handleMinuteChanging: NonNullable<
    DrumPickerProps['onValueChanging']
  > = ({ nativeEvent }) => {
    onMinutesChanging(nativeEvent.index);
  };

  const handleMinuteChange: NonNullable<DrumPickerProps['onChange']> = ({
    nativeEvent
  }) => {
    onMinutesChange(nativeEvent.index);
  };

  const handleSecondChanging: NonNullable<
    DrumPickerProps['onValueChanging']
  > = ({ nativeEvent }) => {
    onSecondsChanging(nativeEvent.index);
  };

  const handleSecondChange: NonNullable<DrumPickerProps['onChange']> = ({
    nativeEvent
  }) => {
    onSecondsChange(nativeEvent.index);
  };

  return (
    <View
      className={cn(
        'relative h-[195px] w-full flex-row items-center justify-center overflow-hidden rounded-lg',
        className
      )}
    >
      <View
        pointerEvents="none"
        className="bg-secondary absolute inset-x-0 top-[65px] h-[65px] rounded-lg"
      />

      <View className="relative h-[195px] max-w-[132px] flex-1 justify-center">
        <WheelPicker
          items={minuteItems}
          selectedIndex={minutes}
          onValueChanging={handleMinuteChanging}
          onChange={handleMinuteChange}
          visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
          itemHeight={PICKER_ITEM_HEIGHT}
          textSize={38}
          selectedTextSize={44}
          style={{ width: '100%' }}
        />
        <View
          pointerEvents="none"
          className="absolute top-0 right-3 bottom-0 z-10 justify-center"
        >
          <Text
            variant="caption"
            className="text-secondary-foreground font-bold"
          >
            MIN
          </Text>
        </View>
      </View>

      <View className="w-8 shrink-0 items-center justify-center">
        <Text variant="h2" tone="muted" className="text-center font-semibold">
          :
        </Text>
      </View>

      <View className="relative h-[195px] max-w-[132px] flex-1 justify-center">
        <WheelPicker
          items={secondItems}
          selectedIndex={seconds}
          onValueChanging={handleSecondChanging}
          onChange={handleSecondChange}
          visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
          itemHeight={PICKER_ITEM_HEIGHT}
          textSize={38}
          selectedTextSize={44}
          style={{ width: '100%' }}
        />
        <View
          pointerEvents="none"
          className="absolute top-0 right-3 bottom-0 z-10 justify-center"
        >
          <Text
            variant="caption"
            className="text-secondary-foreground font-bold"
          >
            SEC
          </Text>
        </View>
      </View>
    </View>
  );
}

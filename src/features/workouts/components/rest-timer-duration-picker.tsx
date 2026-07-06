import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import { cn } from '@/src/lib/utils/cn.utils';
import type {
  OnValueChanged,
  OnValueChanging
} from '@quidone/react-native-wheel-picker';
import { View } from 'react-native';

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

interface RestTimerDurationPickerProps {
  minutes: number;
  seconds: number;
  renderWhen: boolean;
  className?: string;
  onMinutesChanging: (value: number) => void;
  onMinutesChange: (value: number) => void;
  onSecondsChanging: (value: number) => void;
  onSecondsChange: (value: number) => void;
}

export function RestTimerDurationPicker({
  minutes,
  seconds,
  renderWhen,
  className,
  onMinutesChanging,
  onMinutesChange,
  onSecondsChanging,
  onSecondsChange
}: RestTimerDurationPickerProps) {
  const handleMinuteChanging: OnValueChanging<(typeof minuteItems)[number]> = ({
    item
  }) => {
    onMinutesChanging(item.value);
  };

  const handleMinuteChange: OnValueChanged<(typeof minuteItems)[number]> = ({
    item
  }) => {
    onMinutesChange(item.value);
  };

  const handleSecondChanging: OnValueChanging<(typeof secondItems)[number]> = ({
    item
  }) => {
    onSecondsChanging(item.value);
  };

  const handleSecondChange: OnValueChanged<(typeof secondItems)[number]> = ({
    item
  }) => {
    onSecondsChange(item.value);
  };

  return (
    <View className={cn('flex-row items-center justify-center', className)}>
      <View className="relative w-32">
        <WheelPicker
          data={minuteItems}
          value={minutes}
          onValueChanging={handleMinuteChanging}
          onValueChanged={handleMinuteChange}
          renderWhen={renderWhen}
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
          onValueChanging={handleSecondChanging}
          onValueChanged={handleSecondChange}
          renderWhen={renderWhen}
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
  );
}

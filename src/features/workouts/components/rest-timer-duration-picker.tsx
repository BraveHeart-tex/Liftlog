import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import { cn } from '@/src/lib/utils/cn.utils';
import { nativeFontSizes } from '@/src/theme/sizes';
import type {
  OnValueChanged,
  OnValueChanging,
  RenderItemProps
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

type TimerPickerItem = (typeof minuteItems)[number];

type DurationPickerItemProps = RenderItemProps<TimerPickerItem> & {
  isSelected: boolean;
  unit: 'MIN' | 'SEC';
};

function DurationPickerItem({
  item,
  itemTextStyle,
  isSelected,
  unit
}: DurationPickerItemProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="flex-row items-baseline gap-2">
        <Text variant="h2" style={itemTextStyle}>
          {item.label}
        </Text>
        {isSelected ? (
          <Text
            variant="caption"
            className="text-secondary-foreground font-bold"
          >
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

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
    <View
      className={cn(
        'relative h-[190px] w-full flex-row items-center justify-center overflow-hidden rounded-lg',
        className
      )}
    >
      <View
        pointerEvents="none"
        className="bg-secondary absolute inset-x-0 top-[62px] h-[66px] rounded-lg"
      />

      <View className="relative h-[190px] max-w-[132px] flex-1 justify-center">
        <WheelPicker
          data={minuteItems}
          value={minutes}
          onValueChanging={handleMinuteChanging}
          onValueChanged={handleMinuteChange}
          renderWhen={renderWhen}
          visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
          itemHeight={PICKER_ITEM_HEIGHT}
          width="100%"
          overlayItemClassName="bg-transparent"
          itemTextStyle={{
            fontSize: nativeFontSizes.restTimerPicker,
            fontVariant: ['tabular-nums']
          }}
          renderItem={itemProps => (
            <DurationPickerItem
              {...itemProps}
              isSelected={itemProps.item.value === minutes}
              unit="MIN"
            />
          )}
        />
      </View>

      <View className="w-8 shrink-0 items-center justify-center">
        <Text variant="h2" tone="muted" className="text-center font-semibold">
          :
        </Text>
      </View>

      <View className="relative h-[190px] max-w-[132px] flex-1 justify-center">
        <WheelPicker
          data={secondItems}
          value={seconds}
          onValueChanging={handleSecondChanging}
          onValueChanged={handleSecondChange}
          renderWhen={renderWhen}
          visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
          itemHeight={PICKER_ITEM_HEIGHT}
          width="100%"
          overlayItemClassName="bg-transparent"
          itemTextStyle={{
            fontSize: nativeFontSizes.restTimerPicker,
            fontVariant: ['tabular-nums']
          }}
          renderItem={itemProps => (
            <DurationPickerItem
              {...itemProps}
              isSelected={itemProps.item.value === seconds}
              unit="SEC"
            />
          )}
        />
      </View>
    </View>
  );
}

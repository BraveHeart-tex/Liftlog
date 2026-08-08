import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import type { DrumPickerProps } from 'react-native-drum-picker';
import { useCallback } from 'react';
import { View } from 'react-native';

interface SetDurationWheelProps {
  label: string;
  items: string[];
  value: number;
  onValueChanging: (value: number) => void;
  onValueChange: (value: number) => void;
}

const PICKER_ITEM_HEIGHT = 58;
const PICKER_VISIBLE_ITEM_COUNT = 3;

export function SetDurationWheel({
  label,
  items,
  value,
  onValueChanging,
  onValueChange
}: SetDurationWheelProps) {
  const handleValueChanging = useCallback<
    NonNullable<DrumPickerProps['onValueChanging']>
  >(
    ({ nativeEvent }) => {
      onValueChanging(nativeEvent.index);
    },
    [onValueChanging]
  );

  const handleValueChanged = useCallback<
    NonNullable<DrumPickerProps['onChange']>
  >(
    ({ nativeEvent }) => {
      onValueChange(nativeEvent.index);
    },
    [onValueChange]
  );

  return (
    <View className="w-16 items-center">
      <View className="relative w-16">
        <View
          pointerEvents="none"
          className="border-border bg-secondary/40 absolute inset-x-0 top-[58px] h-[58px] rounded-lg border"
        />
        <WheelPicker
          items={items}
          selectedIndex={value}
          onValueChanging={handleValueChanging}
          onChange={handleValueChanged}
          visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
          itemHeight={PICKER_ITEM_HEIGHT}
          textSize={20}
          selectedTextSize={24}
          style={{ width: '100%' }}
        />
      </View>
      <Text
        variant="overline"
        tone="muted"
        className="mt-1 text-[9px] font-bold"
      >
        {label}
      </Text>
    </View>
  );
}

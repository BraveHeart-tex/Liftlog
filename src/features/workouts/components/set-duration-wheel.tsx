import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import type {
  OnValueChanged,
  OnValueChanging
} from '@quidone/react-native-wheel-picker';
import { useCallback } from 'react';
import { View } from 'react-native';

interface DurationWheelItem {
  label: string;
  value: number;
}

interface SetDurationWheelProps {
  label: string;
  data: DurationWheelItem[];
  value: number;
  onValueChanging: (value: number) => void;
  onValueChange: (value: number) => void;
  renderWhen: boolean;
}

const PICKER_ITEM_HEIGHT = 58;
const PICKER_VISIBLE_ITEM_COUNT = 3;

export function SetDurationWheel({
  label,
  data,
  value,
  onValueChanging,
  onValueChange,
  renderWhen
}: SetDurationWheelProps) {
  const handleValueChanging: OnValueChanging<DurationWheelItem> = useCallback(
    ({ item }) => {
      onValueChanging(item.value);
    },
    [onValueChanging]
  );

  const handleValueChanged: OnValueChanged<DurationWheelItem> = useCallback(
    ({ item }) => {
      onValueChange(item.value);
    },
    [onValueChange]
  );

  return (
    <View className="w-19 flex-row items-center justify-center">
      <View className="w-14">
        <WheelPicker
          data={data}
          value={value}
          onValueChanging={handleValueChanging}
          onValueChanged={handleValueChanged}
          renderWhen={renderWhen}
          visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
          itemHeight={PICKER_ITEM_HEIGHT}
          width="100%"
          overlayItemClassName="rounded-lg border border-border bg-secondary/40"
          itemTextClassName="text-2xl font-semibold tabular-nums"
        />
      </View>
      <View pointerEvents="none" className="ml-1 justify-center">
        <Text variant="overline" tone="muted" className="text-[9px] font-bold">
          {label}
        </Text>
      </View>
    </View>
  );
}

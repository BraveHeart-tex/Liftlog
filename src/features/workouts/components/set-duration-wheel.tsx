import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import { View } from 'react-native';

interface DurationWheelItem {
  label: string;
  value: number;
}

interface SetDurationWheelProps {
  label: string;
  data: DurationWheelItem[];
  value: number;
  onValueChange: (value: number) => void;
}

const PICKER_ITEM_HEIGHT = 58;
const PICKER_VISIBLE_ITEM_COUNT = 3;

export function SetDurationWheel({
  label,
  data,
  value,
  onValueChange
}: SetDurationWheelProps) {
  return (
    <View className="w-19 flex-row items-center justify-center">
      <View className="w-14">
        <WheelPicker
          data={data}
          value={value}
          onValueChanged={({ item }) => onValueChange(item.value)}
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

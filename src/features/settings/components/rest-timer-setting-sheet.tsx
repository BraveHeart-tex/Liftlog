import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';

import { XIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

const PICKER_ITEM_HEIGHT = 50;
const PICKER_VISIBLE_ITEM_COUNT = 3;

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
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);

  const handleClose = () => {
    onClose();
    setMinutes(1);
    setSeconds(0);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={['32%']}
      keyboardBehavior="extend"
      enableContentPanningGesture={false}
    >
      <BottomSheetHeader className="flex-row items-center justify-between">
        <BottomSheetTitle>Rest Timer</BottomSheetTitle>
        <Button
          variant="ghost"
          size="icon"
          onPress={onClose}
          accessibilityLabel="Close rest timer sheet"
          className="px-0"
        >
          <Icon icon={XIcon} size="lg" className="text-foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="flex-col items-center px-4 pt-6">
        <View className="flex-row items-center justify-center">
          {/* Minutes Column */}
          <View className="relative w-28">
            <WheelPicker
              data={minuteItems}
              value={minutes}
              onValueChanged={({ item }) => setMinutes(item.value)}
              visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
              itemHeight={PICKER_ITEM_HEIGHT}
              width="100%"
              overlayItemClassName="rounded-lg border border-border bg-secondary/40"
              enableScrollByTapOnItem
            />
            {/* Inline Label vertically centered on the right */}
            <View
              pointerEvents="none"
              className="absolute top-0 right-4 bottom-0 z-10 justify-center"
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

          {/* Centered colon */}
          <View className="w-8 items-center justify-center">
            <Text variant="h1" tone="muted" className="pb-1 text-center">
              :
            </Text>
          </View>

          {/* Seconds Column */}
          <View className="relative w-28">
            <WheelPicker
              data={secondItems}
              value={seconds}
              onValueChanged={({ item }) => setSeconds(item.value)}
              visibleItemCount={PICKER_VISIBLE_ITEM_COUNT}
              itemHeight={PICKER_ITEM_HEIGHT}
              width="100%"
              overlayItemClassName="rounded-lg border border-border bg-secondary/40"
              enableScrollByTapOnItem
            />
            {/* Inline Label vertically centered on the right */}
            <View
              pointerEvents="none"
              className="absolute top-0 right-4 bottom-0 z-10 justify-center"
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
    </BottomSheet>
  );
};

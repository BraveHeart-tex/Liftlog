import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { SetDurationWheel } from '@/src/features/workouts/components/set-duration-wheel';
import {
  formatDurationMs,
  getDurationMsParts
} from '@/src/lib/utils/format-time';
import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SetDurationPickerSheetProps {
  isOpen: boolean;
  valueMs: number;
  onClose: () => void;
  onConfirm: (valueMs: number) => void;
}

const hourItems = Array.from({ length: 24 }, (_, value) => ({
  label: String(value),
  value
}));

const minuteItems = Array.from({ length: 60 }, (_, value) => ({
  label: String(value).padStart(2, '0'),
  value
}));

const secondItems = minuteItems;
const centisecondItems = Array.from({ length: 100 }, (_, value) => ({
  label: String(value).padStart(2, '0'),
  value
}));

export function SetDurationPickerSheet({
  isOpen,
  valueMs,
  onClose,
  onConfirm
}: SetDurationPickerSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      enableDynamicSizing
      enableContentPanningGesture={false}
    >
      <SetDurationPickerSheetContent
        isOpen={isOpen}
        valueMs={valueMs}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </BottomSheet>
  );
}

const SetDurationPickerSheetContent = memo(
  function SetDurationPickerSheetContent({
    isOpen,
    valueMs,
    onClose,
    onConfirm
  }: SetDurationPickerSheetProps) {
    const insets = useSafeAreaInsets();
    const initialParts = getDurationMsParts(valueMs);
    const [hours, setHours] = useState(initialParts.hours);
    const [minutes, setMinutes] = useState(initialParts.minutes);
    const [seconds, setSeconds] = useState(initialParts.seconds);
    const [centiseconds, setCentiseconds] = useState(initialParts.centiseconds);
    const totalMs =
      hours * 3600000 + minutes * 60000 + seconds * 1000 + centiseconds * 10;
    const canConfirm = totalMs >= 10;

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const nextParts = getDurationMsParts(valueMs);

      setHours(nextParts.hours);
      setMinutes(nextParts.minutes);
      setSeconds(nextParts.seconds);
      setCentiseconds(nextParts.centiseconds);
    }, [isOpen, valueMs]);

    return (
      <>
        <BottomSheetHeader className="items-center">
          <BottomSheetTitle>Set time</BottomSheetTitle>
          <Text variant="small" tone="muted" className="mt-1 tabular-nums">
            {formatDurationMs(totalMs)}
          </Text>
        </BottomSheetHeader>

        <View className="px-4">
          <View className="flex-row items-center justify-center gap-1">
            <SetDurationWheel
              label="HR"
              data={hourItems}
              value={hours}
              onValueChange={setHours}
            />
            <SetDurationWheel
              label="MIN"
              data={minuteItems}
              value={minutes}
              onValueChange={setMinutes}
            />
            <SetDurationWheel
              label="SEC"
              data={secondItems}
              value={seconds}
              onValueChange={setSeconds}
            />
            <SetDurationWheel
              label="CS"
              data={centisecondItems}
              value={centiseconds}
              onValueChange={setCentiseconds}
            />
          </View>
        </View>

        <View
          className="flex-row gap-3 px-4 pt-6"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="flex-1">
            <Button variant="secondary" className="w-full" onPress={onClose}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button
              className="w-full"
              disabled={!canConfirm}
              onPress={() => {
                onConfirm(totalMs);
                onClose();
              }}
            >
              Done
            </Button>
          </View>
        </View>
      </>
    );
  }
);

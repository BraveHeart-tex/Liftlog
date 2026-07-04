import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { StopwatchContent } from '@/src/features/workouts/components/stopwatch-content';
import { SetDurationWheel } from '@/src/features/workouts/components/set-duration-wheel';
import { cn } from '@/src/lib/utils/cn';
import {
  formatDurationMs,
  getDurationMsParts
} from '@/src/lib/utils/format-time';
import { memo, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SetDurationPickerSheetProps {
  isOpen: boolean;
  valueMs: number;
  enableStopwatch?: boolean;
  onClose: () => void;
  onConfirm: (valueMs: number) => void;
}

type DurationInputMode = 'stopwatch' | 'manual';

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
  enableStopwatch = false,
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
      {({ isContentReady }) => (
        <SetDurationPickerSheetContent
          isOpen={isOpen}
          valueMs={valueMs}
          enableStopwatch={enableStopwatch}
          onClose={onClose}
          onConfirm={onConfirm}
          renderWheels={isContentReady}
        />
      )}
    </BottomSheet>
  );
}

interface SetDurationPickerSheetContentProps extends SetDurationPickerSheetProps {
  renderWheels: boolean;
}

const SetDurationPickerSheetContent = memo(
  function SetDurationPickerSheetContent({
    isOpen,
    valueMs,
    enableStopwatch = false,
    onClose,
    onConfirm,
    renderWheels
  }: SetDurationPickerSheetContentProps) {
    const insets = useSafeAreaInsets();
    const canUseStopwatch = enableStopwatch;
    const initialParts = getDurationMsParts(valueMs);
    const [mode, setMode] = useState<DurationInputMode>(
      canUseStopwatch ? 'stopwatch' : 'manual'
    );
    const [hours, setHours] = useState(initialParts.hours);
    const [minutes, setMinutes] = useState(initialParts.minutes);
    const [seconds, setSeconds] = useState(initialParts.seconds);
    const [centiseconds, setCentiseconds] = useState(initialParts.centiseconds);
    const hoursRef = useRef(initialParts.hours);
    const minutesRef = useRef(initialParts.minutes);
    const secondsRef = useRef(initialParts.seconds);
    const centisecondsRef = useRef(initialParts.centiseconds);
    const totalMs =
      hours * 3600000 + minutes * 60000 + seconds * 1000 + centiseconds * 10;
    const canConfirm = totalMs >= 10;

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      setMode(canUseStopwatch ? 'stopwatch' : 'manual');
    }, [canUseStopwatch, isOpen]);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const nextParts = getDurationMsParts(valueMs);

      hoursRef.current = nextParts.hours;
      minutesRef.current = nextParts.minutes;
      secondsRef.current = nextParts.seconds;
      centisecondsRef.current = nextParts.centiseconds;
      setHours(nextParts.hours);
      setMinutes(nextParts.minutes);
      setSeconds(nextParts.seconds);
      setCentiseconds(nextParts.centiseconds);
    }, [isOpen, valueMs]);

    const handleHoursChanging = (value: number) => {
      hoursRef.current = value;
    };

    const handleHoursChange = (value: number) => {
      hoursRef.current = value;
      setHours(value);
    };

    const handleMinutesChanging = (value: number) => {
      minutesRef.current = value;
    };

    const handleMinutesChange = (value: number) => {
      minutesRef.current = value;
      setMinutes(value);
    };

    const handleSecondsChanging = (value: number) => {
      secondsRef.current = value;
    };

    const handleSecondsChange = (value: number) => {
      secondsRef.current = value;
      setSeconds(value);
    };

    const handleCentisecondsChanging = (value: number) => {
      centisecondsRef.current = value;
    };

    const handleCentisecondsChange = (value: number) => {
      centisecondsRef.current = value;
      setCentiseconds(value);
    };

    const handleConfirm = () => {
      const selectedTotalMs =
        hoursRef.current * 3600000 +
        minutesRef.current * 60000 +
        secondsRef.current * 1000 +
        centisecondsRef.current * 10;

      if (selectedTotalMs < 10) {
        return;
      }

      onConfirm(selectedTotalMs);
      onClose();
    };

    return (
      <>
        <BottomSheetHeader className="items-center">
          <BottomSheetTitle>Set time</BottomSheetTitle>
          {mode === 'manual' ? (
            <Text
              variant="small"
              tone="muted"
              className="mt-1"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatDurationMs(totalMs)}
            </Text>
          ) : null}
        </BottomSheetHeader>

        {canUseStopwatch ? (
          <DurationModeTabs mode={mode} onChange={setMode} />
        ) : null}

        {mode === 'stopwatch' ? (
          <StopwatchContent
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        ) : (
          <>
            <View className="px-4">
              <View className="flex-row items-center justify-center gap-1">
                <SetDurationWheel
                  label="HR"
                  data={hourItems}
                  value={hours}
                  onValueChanging={handleHoursChanging}
                  onValueChange={handleHoursChange}
                  renderWhen={renderWheels}
                />
                <SetDurationWheel
                  label="MIN"
                  data={minuteItems}
                  value={minutes}
                  onValueChanging={handleMinutesChanging}
                  onValueChange={handleMinutesChange}
                  renderWhen={renderWheels}
                />
                <SetDurationWheel
                  label="SEC"
                  data={secondItems}
                  value={seconds}
                  onValueChanging={handleSecondsChanging}
                  onValueChange={handleSecondsChange}
                  renderWhen={renderWheels}
                />
                <SetDurationWheel
                  label="CS"
                  data={centisecondItems}
                  value={centiseconds}
                  onValueChanging={handleCentisecondsChanging}
                  onValueChange={handleCentisecondsChange}
                  renderWhen={renderWheels}
                />
              </View>
            </View>

            <View
              className="flex-row gap-3 px-4 pt-6"
              style={{ paddingBottom: insets.bottom + 16 }}
            >
              <View className="flex-1">
                <Button
                  variant="secondary"
                  className="w-full"
                  onPress={onClose}
                >
                  Cancel
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  className="w-full"
                  disabled={!canConfirm}
                  onPress={handleConfirm}
                >
                  Done
                </Button>
              </View>
            </View>
          </>
        )}
      </>
    );
  }
);

interface DurationModeTabsProps {
  mode: DurationInputMode;
  onChange: (mode: DurationInputMode) => void;
}

function DurationModeTabs({ mode, onChange }: DurationModeTabsProps) {
  return (
    <View className="px-4 pb-5">
      <View className="bg-muted flex-row rounded-lg p-1">
        <DurationModeTab
          label="Stopwatch"
          selected={mode === 'stopwatch'}
          onPress={() => onChange('stopwatch')}
        />
        <DurationModeTab
          label="Manual"
          selected={mode === 'manual'}
          onPress={() => onChange('manual')}
        />
      </View>
    </View>
  );
}

interface DurationModeTabProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function DurationModeTab({ label, selected, onPress }: DurationModeTabProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'min-h-10 flex-1 items-center justify-center rounded-md px-3',
        selected && 'bg-card'
      )}
    >
      <Text
        variant="bodyMedium"
        tone={selected ? 'default' : 'muted'}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

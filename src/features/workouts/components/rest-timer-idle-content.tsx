import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { WheelPicker } from '@/src/components/ui/wheel-picker';
import {
  MIN_REST_TIMER_SECONDS,
  type RestTimerContext,
  useRestTimerStore
} from '@/src/features/workouts/stores/rest-timer.store';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import type {
  OnValueChanged,
  OnValueChanging
} from '@quidone/react-native-wheel-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

interface RestTimerIdleContentProps {
  defaultDuration: number;
  context?: RestTimerContext;
  openToken: number;
  renderWheels: boolean;
}

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

function getDurationDraft(durationSeconds: number) {
  return getTimerParts(durationSeconds);
}

export function RestTimerIdleContent({
  defaultDuration,
  context,
  openToken,
  renderWheels
}: RestTimerIdleContentProps) {
  const durationSeconds = useRestTimerStore(state => state.durationSeconds);
  const startTimer = useRestTimerStore(state => state.start);
  const lastOpenTokenRef = useRef(openToken);
  const [durationDraft] = useState(() => getDurationDraft(durationSeconds));
  const [minutes, setMinutes] = useState(durationDraft.minutes);
  const [seconds, setSeconds] = useState(durationDraft.seconds);
  const minutesRef = useRef(durationDraft.minutes);
  const secondsRef = useRef(durationDraft.seconds);
  const totalSeconds = minutes * 60 + seconds;
  const canStart = totalSeconds >= MIN_REST_TIMER_SECONDS;

  useEffect(() => {
    if (openToken === lastOpenTokenRef.current) {
      return;
    }

    lastOpenTokenRef.current = openToken;
    const nextDraft = getDurationDraft(defaultDuration);

    minutesRef.current = nextDraft.minutes;
    secondsRef.current = nextDraft.seconds;
    setMinutes(nextDraft.minutes);
    setSeconds(nextDraft.seconds);
  }, [defaultDuration, openToken]);

  const onMinuteChanging: OnValueChanging<(typeof minuteItems)[number]> =
    useCallback(({ item }) => {
      minutesRef.current = item.value;
    }, []);

  const onMinuteChange: OnValueChanged<(typeof minuteItems)[number]> =
    useCallback(({ item }) => {
      minutesRef.current = item.value;
      setMinutes(item.value);
    }, []);

  const onSecondChanging: OnValueChanging<(typeof secondItems)[number]> =
    useCallback(({ item }) => {
      secondsRef.current = item.value;
    }, []);

  const onSecondChange: OnValueChanged<(typeof secondItems)[number]> =
    useCallback(({ item }) => {
      secondsRef.current = item.value;
      setSeconds(item.value);
    }, []);

  const handleStart = () => {
    const selectedTotalSeconds = minutesRef.current * 60 + secondsRef.current;

    if (selectedTotalSeconds < MIN_REST_TIMER_SECONDS) {
      return;
    }

    startTimer(selectedTotalSeconds, context);
  };

  return (
    <>
      <View className="items-center">
        <View className="-mt-4 flex-row items-center justify-center">
          <View className="relative w-32">
            <WheelPicker
              data={minuteItems}
              value={minutes}
              onValueChanging={onMinuteChanging}
              onValueChanged={onMinuteChange}
              renderWhen={renderWheels}
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
              onValueChanging={onSecondChanging}
              onValueChanged={onSecondChange}
              renderWhen={renderWheels}
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
      </View>

      <Button className="w-full" disabled={!canStart} onPress={handleStart}>
        Start
      </Button>
    </>
  );
}

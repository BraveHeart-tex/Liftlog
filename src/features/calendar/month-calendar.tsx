import { Text } from '@/src/components/ui/text';
import {
  DEFAULT_CALENDAR_HEIGHT,
  WEEKDAY_LABELS
} from '@/src/features/calendar/calendar.constants';
import {
  getMarkedDatesForMonth,
  isDateInMonth
} from '@/src/features/calendar/calendar.helpers';
import type {
  CalendarDateMark,
  CalendarDay
} from '@/src/features/calendar/calendar.types';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion';
import { cn } from '@/src/lib/utils/cn';
import { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface MonthCalendarProps {
  dayCellWidth: number;
  days: CalendarDay[];
  handleDayPress: (dateKey: string) => void;
  monthKey: string;
  foregroundColor: string;
  primaryColor: string;
  primaryForegroundColor: string;
  selectedDateKey: string;
  title: string;
  todayKey: string;
  width: number;
  workoutMarks: CalendarDateMark[];
}

const DAY_CELL_HEIGHT = 40;
const DAY_BUTTON_SIZE = 34;
const AnimatedText = Animated.createAnimatedComponent(Text);

interface CalendarDayButtonProps {
  day: CalendarDay;
  isDisabled: boolean;
  isSelected: boolean;
  isToday: boolean;
  mark: ReturnType<typeof getMarkedDatesForMonth>[string] | undefined;
  foregroundColor: string;
  primaryColor: string;
  primaryForegroundColor: string;
  onPress: (dateKey: string) => void;
}

function CalendarDayButton({
  day,
  isDisabled,
  isSelected,
  isToday,
  mark,
  foregroundColor,
  primaryColor,
  primaryForegroundColor,
  onPress
}: CalendarDayButtonProps) {
  const selectedProgress = useSharedValue(isSelected ? 1 : 0);
  const baseTextColor = isToday ? primaryColor : foregroundColor;

  useEffect(() => {
    selectedProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: MOTION_DURATION_MS.standard
    });
  }, [isSelected, selectedProgress]);

  const selectionStyle = useAnimatedStyle(() => ({
    opacity: selectedProgress.value,
    transform: [{ scale: 0.86 + selectedProgress.value * 0.14 }]
  }));

  const textStyle = useAnimatedStyle(
    () => ({
      color: interpolateColor(
        selectedProgress.value,
        [0, 1],
        [baseTextColor, primaryForegroundColor]
      )
    }),
    [baseTextColor, primaryForegroundColor]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        selected: isSelected
      }}
      className="items-center justify-center overflow-hidden rounded-full"
      disabled={isDisabled}
      onPress={() => onPress(day.dateKey)}
      style={{
        height: DAY_BUTTON_SIZE,
        opacity: isDisabled ? 0.35 : 1,
        width: DAY_BUTTON_SIZE
      }}
    >
      <Animated.View
        pointerEvents="none"
        className="absolute rounded-full"
        style={[
          {
            backgroundColor: primaryColor,
            height: DAY_BUTTON_SIZE,
            width: DAY_BUTTON_SIZE
          },
          selectionStyle
        ]}
      />

      <AnimatedText
        variant="bodyMedium"
        className={cn(
          'text-center',
          !isSelected && !isToday && 'text-foreground',
          !isSelected && isToday && 'text-primary'
        )}
        style={textStyle}
      >
        {day.dayOfMonth}
      </AnimatedText>

      {mark?.dots ? (
        <View className="absolute bottom-1 flex-row gap-0.5">
          {mark.dots.map(dot => (
            <View
              key={dot.key}
              className="h-1 w-1 rounded-full"
              style={{
                backgroundColor: isSelected ? dot.selectedDotColor : dot.color
              }}
            />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export const MonthCalendar = memo(
  function MonthCalendar({
    dayCellWidth,
    days,
    handleDayPress,
    monthKey,
    foregroundColor,
    primaryColor,
    primaryForegroundColor,
    selectedDateKey,
    title,
    todayKey,
    width,
    workoutMarks
  }: MonthCalendarProps) {
    const markedDates = useMemo(
      () =>
        getMarkedDatesForMonth({
          selectedDateKey,
          workoutMarks,
          primaryColor,
          primaryForegroundColor
        }),
      [primaryColor, primaryForegroundColor, selectedDateKey, workoutMarks]
    );

    return (
      <View
        className="px-3 py-4"
        style={{ height: DEFAULT_CALENDAR_HEIGHT, width }}
        testID={`workout-log-calendar-${monthKey}`}
      >
        <Text variant="h3" className="mb-5 text-center">
          {title}
        </Text>

        <View className="mb-2 flex-row">
          {WEEKDAY_LABELS.map(weekday => (
            <View
              key={weekday}
              className="items-center justify-center"
              style={{ width: dayCellWidth }}
            >
              <Text variant="caption" tone="muted">
                {weekday}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {days.map(day => {
            const mark = markedDates[day.dateKey];
            const isSelected = mark?.selected === true;
            const isToday = day.dateKey === todayKey;
            const isDisabled = !day.isInMonth || day.dateKey > todayKey;

            return (
              <View
                key={day.dateKey}
                className="items-center justify-center"
                style={{ height: DAY_CELL_HEIGHT, width: dayCellWidth }}
              >
                {day.isInMonth ? (
                  <CalendarDayButton
                    day={day}
                    foregroundColor={foregroundColor}
                    isDisabled={isDisabled}
                    isSelected={isSelected}
                    isToday={isToday}
                    mark={mark}
                    primaryColor={primaryColor}
                    primaryForegroundColor={primaryForegroundColor}
                    onPress={handleDayPress}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.dayCellWidth !== nextProps.dayCellWidth ||
      prevProps.days !== nextProps.days ||
      prevProps.handleDayPress !== nextProps.handleDayPress ||
      prevProps.monthKey !== nextProps.monthKey ||
      prevProps.foregroundColor !== nextProps.foregroundColor ||
      prevProps.primaryColor !== nextProps.primaryColor ||
      prevProps.primaryForegroundColor !== nextProps.primaryForegroundColor ||
      prevProps.title !== nextProps.title ||
      prevProps.todayKey !== nextProps.todayKey ||
      prevProps.width !== nextProps.width ||
      prevProps.workoutMarks !== nextProps.workoutMarks
    ) {
      return false;
    }

    if (prevProps.selectedDateKey === nextProps.selectedDateKey) {
      return true;
    }

    return (
      !isDateInMonth(prevProps.selectedDateKey, nextProps.monthKey) &&
      !isDateInMonth(nextProps.selectedDateKey, nextProps.monthKey)
    );
  }
);

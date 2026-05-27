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
import { cn } from '@/src/lib/utils/cn';
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

interface MonthCalendarProps {
  dayCellWidth: number;
  days: CalendarDay[];
  handleDayPress: (dateKey: string) => void;
  monthKey: string;
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

export const MonthCalendar = memo(
  function MonthCalendar({
    dayCellWidth,
    days,
    handleDayPress,
    monthKey,
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
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: isDisabled,
                      selected: isSelected
                    }}
                    className={cn(
                      'items-center justify-center rounded-full',
                      isSelected && 'bg-primary'
                    )}
                    disabled={isDisabled}
                    onPress={() => handleDayPress(day.dateKey)}
                    style={{
                      height: DAY_BUTTON_SIZE,
                      opacity: isDisabled ? 0.35 : 1,
                      width: DAY_BUTTON_SIZE
                    }}
                  >
                    <Text
                      variant="bodyMedium"
                      className={cn(
                        'text-center',
                        isSelected
                          ? 'text-primary-foreground'
                          : isToday
                            ? 'text-primary'
                            : 'text-foreground'
                      )}
                    >
                      {day.dayOfMonth}
                    </Text>

                    {mark?.dots ? (
                      <View className="absolute bottom-1 flex-row gap-0.5">
                        {mark.dots.map(dot => (
                          <View
                            key={dot.key}
                            className="h-1 w-1 rounded-full"
                            style={{
                              backgroundColor: isSelected
                                ? dot.selectedDotColor
                                : dot.color
                            }}
                          />
                        ))}
                      </View>
                    ) : null}
                  </Pressable>
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

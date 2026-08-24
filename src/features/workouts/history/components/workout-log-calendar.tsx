import { StyledActivityIndicator } from '@/src/components/styled/activity-indicator';
import { StyledFlatList } from '@/src/components/styled/flat-list';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import {
  CALENDAR_COLUMNS,
  CALENDAR_GRID_HEIGHT,
  DEFAULT_CALENDAR_HEIGHT,
  DEFAULT_PAST_MONTH_RANGE
} from '@/src/features/workouts/history/calendar/workout-log-calendar.constants';
import {
  getCalendarMonths,
  getMonthIndexForDate,
  isDateInMonth
} from '@/src/features/workouts/history/calendar/workout-log-calendar.helpers';
import type {
  CalendarDateMark,
  CalendarMonth
} from '@/src/features/workouts/history/calendar/workout-log-calendar.types';
import { MonthCalendar } from '@/src/features/workouts/history/calendar/month-calendar';

import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type FlatList,
  View
} from 'react-native';

interface WorkoutLogCalendarProps {
  pastMonthRange?: number;
  selectedDateKey: string;
  workoutCountByDateKey: Map<string, number>;
  onSelectDate: (dateKey: string) => void;
}

function getWorkoutMarksByMonth(workoutCountByDateKey: Map<string, number>) {
  const workoutMarksByMonth = new Map<string, CalendarDateMark[]>();

  for (const [dateKey, workoutCount] of workoutCountByDateKey) {
    const monthKey = dateKey.slice(0, 7);
    const workoutMarks = workoutMarksByMonth.get(monthKey) ?? [];

    workoutMarks.push({ dateKey, count: workoutCount });
    workoutMarksByMonth.set(monthKey, workoutMarks);
  }

  for (const workoutMarks of workoutMarksByMonth.values()) {
    workoutMarks.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }

  return workoutMarksByMonth;
}

const DEFAULT_WORKOUT_MARKS: CalendarDateMark[] = [];

export function WorkoutLogCalendar({
  pastMonthRange = DEFAULT_PAST_MONTH_RANGE,
  selectedDateKey,
  workoutCountByDateKey,
  onSelectDate
}: WorkoutLogCalendarProps) {
  const { colors } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const [calendarWidth, setCalendarWidth] = useState<number | null>(null);
  const calendarListRef = useRef<FlatList<CalendarMonth>>(null);

  const { foreground, primary, primaryForeground } = colors;
  const todayKey = toLocalDateKey(Date.now());

  const calendarMonths = useMemo(
    () => getCalendarMonths(todayKey, pastMonthRange),
    [pastMonthRange, todayKey]
  );
  const currentMonthIndex = useMemo(
    () => getMonthIndexForDate(calendarMonths, todayKey),
    [calendarMonths, todayKey]
  );
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(currentMonthIndex);
  const workoutMarksByMonth = useMemo(
    () => getWorkoutMarksByMonth(workoutCountByDateKey),
    [workoutCountByDateKey]
  );

  useEffect(() => {
    setVisibleMonthIndex(currentMonthIndex);
  }, [currentMonthIndex]);

  const handleDayPress = useCallback(
    (dateKey: string) => onSelectDate(dateKey),
    [onSelectDate]
  );

  const scrollToMonth = useCallback(
    (index: number, selectToday = false) => {
      if (calendarWidth === null) {
        return;
      }

      calendarListRef.current?.scrollToIndex({
        animated: !reduceMotion,
        index
      });
      setVisibleMonthIndex(index);

      if (selectToday) {
        onSelectDate(todayKey);
      }
    },
    [calendarWidth, onSelectDate, reduceMotion, todayKey]
  );

  const handleMonthScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!calendarWidth) {
        return;
      }

      const nextIndex = Math.max(
        0,
        Math.min(
          calendarMonths.length - 1,
          Math.round(event.nativeEvent.contentOffset.x / calendarWidth)
        )
      );

      setVisibleMonthIndex(nextIndex);
    },
    [calendarMonths.length, calendarWidth]
  );

  const dayCellWidth = calendarWidth
    ? Math.floor(calendarWidth / CALENDAR_COLUMNS)
    : 0;

  const getMonthItemLayout = useCallback(
    (_: ArrayLike<CalendarMonth> | null | undefined, index: number) => ({
      index,
      length: calendarWidth ?? 0,
      offset: (calendarWidth ?? 0) * index
    }),
    [calendarWidth]
  );

  const keyExtractor = useCallback((item: CalendarMonth) => item.monthKey, []);

  const renderCalendarMonth = useCallback(
    ({ item }: { item: CalendarMonth }) => (
      <MonthCalendar
        dayCellWidth={dayCellWidth}
        days={item.days}
        handleDayPress={handleDayPress}
        monthKey={item.monthKey}
        foregroundColor={foreground}
        primaryColor={primary}
        primaryForegroundColor={primaryForeground}
        selectedDateKey={
          isDateInMonth({
            dateKey: selectedDateKey,
            monthKey: item.monthKey
          })
            ? selectedDateKey
            : ''
        }
        todayKey={todayKey}
        width={calendarWidth ?? 0}
        workoutMarks={
          workoutMarksByMonth.get(item.monthKey) ?? DEFAULT_WORKOUT_MARKS
        }
      />
    ),
    [
      calendarWidth,
      dayCellWidth,
      handleDayPress,
      foreground,
      primary,
      primaryForeground,
      selectedDateKey,
      todayKey,
      workoutMarksByMonth
    ]
  );

  const visibleMonth =
    calendarMonths[visibleMonthIndex] ?? calendarMonths[currentMonthIndex];

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);

    if (width <= 0) {
      return;
    }

    setCalendarWidth(prev => (prev === width ? prev : width));
  }, []);

  return (
    <View
      className="border-border bg-card overflow-hidden rounded-lg border"
      onLayout={handleLayout}
      style={{ height: DEFAULT_CALENDAR_HEIGHT }}
    >
      {calendarWidth !== null ? (
        <>
          <View className="h-12 flex-row items-center gap-1 px-4">
            <Text className="flex-1" numberOfLines={1} variant="h3">
              {visibleMonth?.title}
            </Text>
            <Button
              accessibilityLabel="Go to today"
              className="min-h-11 px-2"
              disabled={visibleMonthIndex === currentMonthIndex}
              onPress={() => scrollToMonth(currentMonthIndex, true)}
              size="sm"
              textClassName="text-secondary-foreground"
              variant="ghost"
            >
              Today
            </Button>
            <Button
              accessibilityLabel="Previous month"
              className="h-11 w-11"
              disabled={visibleMonthIndex === 0}
              onPress={() => scrollToMonth(visibleMonthIndex - 1)}
              size="icon"
              variant="ghost"
            >
              <Icon as={ChevronLeftIcon} tone="secondaryForeground" />
            </Button>
            <Button
              accessibilityLabel="Next month"
              className="h-11 w-11"
              disabled={visibleMonthIndex === calendarMonths.length - 1}
              onPress={() => scrollToMonth(visibleMonthIndex + 1)}
              size="icon"
              variant="ghost"
            >
              <Icon as={ChevronRightIcon} tone="secondaryForeground" />
            </Button>
          </View>
          <StyledFlatList
            ref={calendarListRef}
            data={calendarMonths}
            decelerationRate="fast"
            directionalLockEnabled
            disableIntervalMomentum
            getItemLayout={getMonthItemLayout}
            horizontal
            initialNumToRender={1}
            initialScrollIndex={currentMonthIndex}
            keyExtractor={keyExtractor}
            maxToRenderPerBatch={2}
            nestedScrollEnabled
            onMomentumScrollEnd={handleMonthScrollEnd}
            pagingEnabled
            renderItem={renderCalendarMonth}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={calendarWidth}
            style={{ height: CALENDAR_GRID_HEIGHT, width: calendarWidth }}
            windowSize={3}
          />
        </>
      ) : (
        <View
          accessibilityLabel="Loading calendar"
          accessibilityRole="progressbar"
          className="flex-1 items-center justify-center"
        >
          <StyledActivityIndicator className="text-primary" size="small" />
        </View>
      )}
    </View>
  );
}

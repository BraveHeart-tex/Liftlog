import { StyledActivityIndicator } from '@/src/components/styled/activity-indicator';
import { StyledFlatList } from '@/src/components/styled/flat-list';
import {
  CALENDAR_COLUMNS,
  DEFAULT_CALENDAR_HEIGHT,
  DEFAULT_PAST_MONTH_RANGE
} from '@/src/features/calendar/calendar.constants';
import {
  getCalendarMonths,
  getMonthIndexForDate,
  isDateInMonth
} from '@/src/features/calendar/calendar.helpers';
import type {
  CalendarDateMark,
  CalendarMonth
} from '@/src/features/calendar/calendar.types';
import { MonthCalendar } from '@/src/features/calendar/month-calendar';

import { toLocalDateKey } from '@/src/lib/utils/date';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

interface WorkoutLogCalendarProps {
  pastMonthRange?: number;
  selectedDateKey: string;
  workoutCountByDateKey: Map<string, number>;
  onSelectDate: (dateKey: string) => void;
  onScrollLockChange?: (isLocked: boolean) => void;
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
  onSelectDate,
  onScrollLockChange
}: WorkoutLogCalendarProps) {
  const { colors } = useAppTheme();
  const [calendarWidth, setCalendarWidth] = useState<number | null>(null);

  const { primary, primaryForeground } = colors;
  const todayKey = toLocalDateKey(Date.now());

  const calendarMonths = useMemo(
    () => getCalendarMonths(todayKey, pastMonthRange),
    [pastMonthRange, todayKey]
  );
  const selectedMonthIndex = useMemo(
    () => getMonthIndexForDate(calendarMonths, selectedDateKey),
    [calendarMonths, selectedDateKey]
  );
  const workoutMarksByMonth = useMemo(
    () => getWorkoutMarksByMonth(workoutCountByDateKey),
    [workoutCountByDateKey]
  );

  const handleDayPress = useCallback(
    (dateKey: string) => onSelectDate(dateKey),
    [onSelectDate]
  );

  const lockParentScroll = useCallback(
    () => onScrollLockChange?.(true),
    [onScrollLockChange]
  );

  const unlockParentScroll = useCallback(
    () => onScrollLockChange?.(false),
    [onScrollLockChange]
  );

  useEffect(() => unlockParentScroll, [unlockParentScroll]);

  const dayCellWidth = calendarWidth
    ? Math.floor((calendarWidth - 24) / CALENDAR_COLUMNS)
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
        primaryColor={primary}
        primaryForegroundColor={primaryForeground}
        selectedDateKey={
          isDateInMonth(selectedDateKey, item.monthKey) ? selectedDateKey : ''
        }
        title={item.title}
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
      primary,
      primaryForeground,
      selectedDateKey,
      todayKey,
      workoutMarksByMonth
    ]
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);

    if (width <= 0) {
      return;
    }

    setCalendarWidth(prev => (prev === width ? prev : width));
  }, []);

  return (
    <View
      className="bg-card overflow-hidden rounded-xl"
      onLayout={handleLayout}
      onTouchCancel={unlockParentScroll}
      onTouchEnd={unlockParentScroll}
      onTouchStart={lockParentScroll}
      style={{ height: DEFAULT_CALENDAR_HEIGHT }}
    >
      {calendarWidth !== null ? (
        <StyledFlatList
          data={calendarMonths}
          decelerationRate="fast"
          directionalLockEnabled
          disableIntervalMomentum
          getItemLayout={getMonthItemLayout}
          horizontal
          initialNumToRender={3}
          initialScrollIndex={selectedMonthIndex}
          keyExtractor={keyExtractor}
          maxToRenderPerBatch={3}
          nestedScrollEnabled
          onMomentumScrollEnd={unlockParentScroll}
          onScrollBeginDrag={lockParentScroll}
          onScrollEndDrag={unlockParentScroll}
          pagingEnabled
          removeClippedSubviews
          renderItem={renderCalendarMonth}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={calendarWidth}
          style={{ height: DEFAULT_CALENDAR_HEIGHT, width: calendarWidth }}
          windowSize={5}
        />
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

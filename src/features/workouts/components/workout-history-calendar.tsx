import { StyledActivityIndicator } from '@/src/components/styled/activity-indicator';
import { StyledFlashList } from '@/src/components/styled/flash-list';
import { toLocalDateKey } from '@/src/lib/utils/date';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { memo, useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

interface WorkoutHistoryCalendarProps {
  selectedDateKey: string;
  workoutCountByDateKey: Map<string, number>;
  onSelectDate: (dateKey: string) => void;
}

type CalendarMarkedDates = Record<string, CalendarMarkedDate>;

interface CalendarMarkedDate {
  disabled?: boolean;
  inactive?: boolean;
  marked?: boolean;
  dots?: { key?: string; color: string; selectedDotColor?: string }[];
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
  today?: boolean;
  disableTouchEvent?: boolean;
}

const CALENDAR_HEIGHT = 360;
const CALENDAR_DRAW_DISTANCE_MONTHS = 4;
const PAST_SCROLL_RANGE = 24;
const EMPTY_WORKOUT_MARKS: WorkoutDateMark[] = [];

interface CalendarMonth {
  dateKey: string;
  monthKey: string;
}

interface WorkoutDateMark {
  dateKey: string;
  workoutCount: number;
}

interface MonthCalendarProps {
  calendarTheme: ReturnType<typeof getCalendarTheme>;
  dateKey: string;
  handleDayPress: (day: DateData) => void;
  monthKey: string;
  primaryColor: string;
  primaryForegroundColor: string;
  selectedDateKey: string;
  todayKey: string;
  width: number;
  workoutMarks: WorkoutDateMark[];
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');

  return `${year}-${month}`;
}

function getMonthDateKey(date: Date): string {
  return `${toMonthKey(date)}-01`;
}

function addMonths(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function getCalendarMonths(todayKey: string): CalendarMonth[] {
  const currentMonth = parseDateKey(todayKey);

  currentMonth.setDate(1);

  return Array.from({ length: PAST_SCROLL_RANGE + 1 }, (_, index) => {
    const monthDate = addMonths(currentMonth, -index);

    return {
      dateKey: getMonthDateKey(monthDate),
      monthKey: toMonthKey(monthDate)
    };
  });
}

function getWorkoutMarksByMonth(workoutCountByDateKey: Map<string, number>) {
  const workoutMarksByMonth = new Map<string, WorkoutDateMark[]>();

  for (const [dateKey, workoutCount] of workoutCountByDateKey) {
    const monthKey = dateKey.slice(0, 7);
    const workoutMarks = workoutMarksByMonth.get(monthKey) ?? [];

    workoutMarks.push({ dateKey, workoutCount });
    workoutMarksByMonth.set(monthKey, workoutMarks);
  }

  for (const workoutMarks of workoutMarksByMonth.values()) {
    workoutMarks.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }

  return workoutMarksByMonth;
}

function getMarkedDatesForMonth({
  selectedDateKey,
  workoutMarks,
  primaryColor,
  primaryForegroundColor
}: {
  selectedDateKey: string;
  workoutMarks: WorkoutDateMark[];
  primaryColor: string;
  primaryForegroundColor: string;
}): CalendarMarkedDates {
  const markedDates: CalendarMarkedDates = {};

  for (const { dateKey, workoutCount } of workoutMarks) {
    markedDates[dateKey] = {
      marked: true,
      dots: Array.from({ length: Math.min(workoutCount, 3) }, (_, index) => ({
        key: `${dateKey}-${index}`,
        color: primaryColor,
        selectedDotColor: primaryForegroundColor
      }))
    };
  }

  if (selectedDateKey) {
    markedDates[selectedDateKey] = {
      ...(markedDates[selectedDateKey] ?? {}),
      selected: true,
      selectedColor: primaryColor,
      selectedTextColor: primaryForegroundColor
    };
  }

  return markedDates;
}

function getCalendarTheme({
  card,
  foreground,
  mutedForeground,
  primary,
  primaryForeground
}: {
  card: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
}) {
  return {
    backgroundColor: card,
    calendarBackground: card,
    dayTextColor: foreground,
    monthTextColor: foreground,
    textDisabledColor: mutedForeground,
    textSectionTitleColor: mutedForeground,
    todayTextColor: primary,
    selectedDayBackgroundColor: primary,
    selectedDayTextColor: primaryForeground,
    arrowColor: foreground,
    dotColor: primary,
    selectedDotColor: primaryForeground,
    textDayFontFamily: 'Inter_500Medium',
    textMonthFontFamily: 'Inter_600SemiBold',
    textDayHeaderFontFamily: 'Inter_500Medium',
    textDayFontSize: 14,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 12,
    textDayFontWeight: '500',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '500',
    'stylesheet.calendar.main': {
      container: {
        paddingLeft: 5,
        paddingRight: 5
      }
    }
  } as const;
}

function isDateInMonth(dateKey: string, monthKey: string): boolean {
  return dateKey.startsWith(`${monthKey}-`);
}

function getMonthIndexForDate(
  calendarMonths: CalendarMonth[],
  dateKey: string
): number {
  const monthKey = dateKey.slice(0, 7);
  const monthIndex = calendarMonths.findIndex(
    month => month.monthKey === monthKey
  );

  return monthIndex >= 0 ? monthIndex : 0;
}

const MonthCalendar = memo(
  function MonthCalendar({
    calendarTheme,
    dateKey,
    handleDayPress,
    monthKey,
    primaryColor,
    primaryForegroundColor,
    selectedDateKey,
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
      <View style={{ height: CALENDAR_HEIGHT, width }}>
        <Calendar
          key={dateKey}
          disableMonthChange
          firstDay={1}
          hideArrows
          hideExtraDays
          initialDate={dateKey}
          markingType="multi-dot"
          markedDates={markedDates}
          maxDate={todayKey}
          onDayPress={handleDayPress}
          style={{ minHeight: CALENDAR_HEIGHT, width }}
          theme={calendarTheme}
          testID={`history-calendar-${monthKey}`}
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.calendarTheme !== nextProps.calendarTheme ||
      prevProps.dateKey !== nextProps.dateKey ||
      prevProps.handleDayPress !== nextProps.handleDayPress ||
      prevProps.monthKey !== nextProps.monthKey ||
      prevProps.primaryColor !== nextProps.primaryColor ||
      prevProps.primaryForegroundColor !== nextProps.primaryForegroundColor ||
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

export function WorkoutHistoryCalendar({
  selectedDateKey,
  workoutCountByDateKey,
  onSelectDate
}: WorkoutHistoryCalendarProps) {
  const { colors, colorScheme } = useAppTheme();
  const [calendarWidth, setCalendarWidth] = useState<number | null>(null);

  const { primary, primaryForeground, card, foreground, mutedForeground } =
    colors;
  const todayKey = toLocalDateKey(Date.now());

  const calendarMonths = useMemo(() => getCalendarMonths(todayKey), [todayKey]);
  const selectedMonthIndex = useMemo(
    () => getMonthIndexForDate(calendarMonths, selectedDateKey),
    [calendarMonths, selectedDateKey]
  );
  const workoutMarksByMonth = useMemo(
    () => getWorkoutMarksByMonth(workoutCountByDateKey),
    [workoutCountByDateKey]
  );

  const calendarTheme = useMemo(
    () =>
      getCalendarTheme({
        card,
        foreground,
        mutedForeground,
        primary,
        primaryForeground
      }),
    [card, foreground, mutedForeground, primary, primaryForeground]
  );

  const handleDayPress = useCallback(
    (day: DateData) => onSelectDate(day.dateString),
    [onSelectDate]
  );

  const getItemType = useCallback(() => 'calendar-month', []);

  const keyExtractor = useCallback((item: CalendarMonth) => item.monthKey, []);

  const renderCalendarItem = useCallback(
    ({ item }: { item: CalendarMonth }) => (
      <MonthCalendar
        calendarTheme={calendarTheme}
        dateKey={item.dateKey}
        handleDayPress={handleDayPress}
        monthKey={item.monthKey}
        primaryColor={primary}
        primaryForegroundColor={primaryForeground}
        selectedDateKey={
          isDateInMonth(selectedDateKey, item.monthKey) ? selectedDateKey : ''
        }
        todayKey={todayKey}
        width={calendarWidth ?? 0}
        workoutMarks={
          workoutMarksByMonth.get(item.monthKey) ?? EMPTY_WORKOUT_MARKS
        }
      />
    ),
    [
      calendarTheme,
      calendarWidth,
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
      style={{ height: CALENDAR_HEIGHT }}
    >
      {calendarWidth !== null ? (
        <StyledFlashList
          key={`${colorScheme}-${calendarWidth}`}
          data={calendarMonths}
          decelerationRate={0.89}
          disableIntervalMomentum
          drawDistance={CALENDAR_DRAW_DISTANCE_MONTHS * calendarWidth}
          getItemType={getItemType}
          horizontal
          initialScrollIndex={selectedMonthIndex}
          keyExtractor={keyExtractor}
          maintainVisibleContentPosition={{ disabled: true }}
          pagingEnabled
          renderItem={renderCalendarItem}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={calendarWidth}
          style={{ height: CALENDAR_HEIGHT, width: calendarWidth }}
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

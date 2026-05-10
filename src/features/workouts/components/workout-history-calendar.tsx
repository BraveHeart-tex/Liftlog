import { useAppTheme } from '@/src/theme/app-theme-provider';
import { useCallback, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { CalendarList, type DateData } from 'react-native-calendars';

interface WorkoutHistoryCalendarProps {
  selectedDateKey: string;
  workoutCountByDateKey: Map<string, number>;
  onSelectDate: (dateKey: string) => void;
}

type CalendarMarkedDates = Record<
  string,
  {
    marked?: boolean;
    dots?: { key: string; color: string }[];
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
  }
>;

const TODAY = new Date().toISOString().split('T')[0];

function getMarkedDates({
  selectedDateKey,
  workoutCountByDateKey,
  primaryColor,
  primaryForegroundColor
}: {
  selectedDateKey: string;
  workoutCountByDateKey: Map<string, number>;
  primaryColor: string;
  primaryForegroundColor: string;
}): CalendarMarkedDates {
  const markedDates: CalendarMarkedDates = {};

  for (const [dateKey, workoutCount] of workoutCountByDateKey) {
    markedDates[dateKey] = {
      marked: true,
      dots: Array.from({ length: Math.min(workoutCount, 3) }, (_, index) => ({
        key: `${dateKey}-${index}`,
        color: primaryColor
      }))
    };
  }

  markedDates[selectedDateKey] = {
    ...(markedDates[selectedDateKey] ?? {}),
    selected: true,
    selectedColor: primaryColor,
    selectedTextColor: primaryForegroundColor
  };

  return markedDates;
}

export function WorkoutHistoryCalendar({
  selectedDateKey,
  workoutCountByDateKey,
  onSelectDate
}: WorkoutHistoryCalendarProps) {
  const { colors, colorScheme } = useAppTheme();
  const [calendarWidth, setCalendarWidth] = useState<number | null>(null);
  const colorSchemeRef = useRef(colorScheme);

  const { primary, primaryForeground, card, foreground, mutedForeground } =
    colors;

  const markedDates = useMemo(
    () =>
      getMarkedDates({
        selectedDateKey,
        workoutCountByDateKey,
        primaryColor: primary,
        primaryForegroundColor: primaryForeground
      }),
    [primary, primaryForeground, selectedDateKey, workoutCountByDateKey]
  );

  const calendarTheme = useMemo(
    () =>
      ({
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
        textMonthFontWeight: 600,
        textDayHeaderFontWeight: 500,
        'stylesheet.calendar-list.main': {
          placeholderText: {
            color: card
          }
        }
      }) as const,
    [card, foreground, mutedForeground, primary, primaryForeground]
  );

  const handleDayPress = useCallback(
    (day: DateData) => onSelectDate(day.dateString),
    [onSelectDate]
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;

    setCalendarWidth(prev => (prev === width ? prev : width));
  }, []);

  if (colorSchemeRef.current !== colorScheme) {
    colorSchemeRef.current = colorScheme;
  }

  return (
    <View
      onLayout={handleLayout}
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      {calendarWidth !== null ? (
        <CalendarList
          key={colorSchemeRef.current}
          animateScroll
          calendarWidth={calendarWidth}
          current={selectedDateKey}
          maxDate={TODAY}
          firstDay={1}
          futureScrollRange={0}
          hideExtraDays
          horizontal
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          pagingEnabled
          pastScrollRange={24}
          removeClippedSubviews
          showScrollIndicator={false}
          theme={calendarTheme}
          windowSize={5}
        />
      ) : null}
    </View>
  );
}

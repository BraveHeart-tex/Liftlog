import { useAppTheme } from '@/src/theme/app-theme-provider';
import { useMemo } from 'react';
import { Calendar, type DateData } from 'react-native-calendars';

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

function getMarkedDates({
  selectedDateKey,
  workoutCountByDateKey,
  colors
}: {
  selectedDateKey: string;
  workoutCountByDateKey: Map<string, number>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}): CalendarMarkedDates {
  const markedDates: CalendarMarkedDates = {};

  for (const [dateKey, workoutCount] of workoutCountByDateKey) {
    markedDates[dateKey] = {
      marked: true,
      dots: Array.from({ length: Math.min(workoutCount, 3) }, (_, index) => ({
        key: `${dateKey}-${index}`,
        color: colors.primary
      }))
    };
  }

  markedDates[selectedDateKey] = {
    ...(markedDates[selectedDateKey] ?? {}),
    selected: true,
    selectedColor: colors.primary,
    selectedTextColor: colors.primaryForeground
  };

  return markedDates;
}

export function WorkoutHistoryCalendar({
  selectedDateKey,
  workoutCountByDateKey,
  onSelectDate
}: WorkoutHistoryCalendarProps) {
  const { colors, colorScheme } = useAppTheme();

  const markedDates = useMemo(
    () =>
      getMarkedDates({
        selectedDateKey,
        workoutCountByDateKey,
        colors
      }),
    [colors, selectedDateKey, workoutCountByDateKey]
  );

  const calendarTheme = useMemo(
    () =>
      ({
        backgroundColor: colors.card,
        calendarBackground: colors.card,
        dayTextColor: colors.foreground,
        monthTextColor: colors.foreground,
        textDisabledColor: colors.mutedForeground,
        textSectionTitleColor: colors.mutedForeground,
        todayTextColor: colors.primary,
        selectedDayBackgroundColor: colors.primary,
        selectedDayTextColor: colors.primaryForeground,
        arrowColor: colors.foreground,
        dotColor: colors.primary,
        selectedDotColor: colors.primaryForeground,
        textDayFontFamily: 'Inter_400Regular',
        textMonthFontFamily: 'Inter_600SemiBold',
        textDayHeaderFontFamily: 'Inter_500Medium',
        textDayFontSize: 14,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 12,
        textDayFontWeight: 500,
        textMonthFontWeight: 600,
        textDayHeaderFontWeight: 500
      }) as const,
    [colors]
  );

  return (
    <Calendar
      key={colorScheme}
      current={selectedDateKey}
      firstDay={1}
      hideExtraDays
      markingType="multi-dot"
      markedDates={markedDates}
      onDayPress={(day: DateData) => onSelectDate(day.dateString)}
      style={{
        borderRadius: 16,
        overflow: 'hidden'
      }}
      theme={calendarTheme}
    />
  );
}

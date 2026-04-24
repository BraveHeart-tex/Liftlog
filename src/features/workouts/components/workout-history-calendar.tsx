import type { Workout } from '@/src/db/schema';
import { useAppTheme } from '@/src/theme/app-theme-provider';
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

export function toLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getWorkoutCountByDateKey(
  workouts: Workout[]
): Map<string, number> {
  const workoutCountByDateKey = new Map<string, number>();

  for (const workout of workouts) {
    const dateKey = toLocalDateKey(workout.startedAt);

    workoutCountByDateKey.set(
      dateKey,
      (workoutCountByDateKey.get(dateKey) ?? 0) + 1
    );
  }

  return workoutCountByDateKey;
}

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
  const { colors } = useAppTheme();

  return (
    <Calendar
      current={selectedDateKey}
      firstDay={1}
      hideExtraDays
      markingType="multi-dot"
      markedDates={getMarkedDates({
        selectedDateKey,
        workoutCountByDateKey,
        colors
      })}
      onDayPress={(day: DateData) => onSelectDate(day.dateString)}
      style={{
        borderRadius: 16,
        overflow: 'hidden'
      }}
      theme={{
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
        textDayFontSize: 14,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 12,
        textDayFontWeight: '500',
        textMonthFontWeight: '600',
        textDayHeaderFontWeight: '500'
      }}
    />
  );
}

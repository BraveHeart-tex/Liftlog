import {
  CALENDAR_COLUMNS,
  CALENDAR_ROWS
} from '@/src/features/calendar/calendar.constants';
import type {
  CalendarDateMark,
  CalendarDay,
  CalendarMarkedDates,
  CalendarMonth
} from '@/src/features/calendar/calendar.types';
import { toLocalDateKey } from '@/src/lib/utils/date';

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

function getMonthTitle(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function getCalendarDaysForMonth(monthDate: Date): CalendarDay[] {
  const firstDayOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1
  );
  const mondayBasedWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const firstVisibleDate = new Date(firstDayOfMonth);

  firstVisibleDate.setDate(firstVisibleDate.getDate() - mondayBasedWeekday);

  return Array.from(
    { length: CALENDAR_COLUMNS * CALENDAR_ROWS },
    (_, index) => {
      const date = new Date(firstVisibleDate);

      date.setDate(firstVisibleDate.getDate() + index);

      return {
        dateKey: toLocalDateKey(date.getTime()),
        dayOfMonth: date.getDate(),
        isInMonth: date.getMonth() === monthDate.getMonth()
      };
    }
  );
}

export function getCalendarMonths(
  todayKey: string,
  pastMonthRange: number
): CalendarMonth[] {
  const currentMonth = parseDateKey(todayKey);

  currentMonth.setDate(1);

  return Array.from({ length: pastMonthRange + 1 }, (_, index) => {
    const monthDate = addMonths(currentMonth, -index);

    return {
      dateKey: getMonthDateKey(monthDate),
      days: getCalendarDaysForMonth(monthDate),
      monthKey: toMonthKey(monthDate),
      title: getMonthTitle(monthDate)
    };
  });
}

export function getMonthIndexForDate(
  calendarMonths: CalendarMonth[],
  dateKey: string
): number {
  const monthKey = dateKey.slice(0, 7);
  const monthIndex = calendarMonths.findIndex(
    month => month.monthKey === monthKey
  );

  return monthIndex >= 0 ? monthIndex : 0;
}

export function getMarkedDatesForMonth({
  selectedDateKey,
  workoutMarks,
  primaryColor,
  primaryForegroundColor
}: {
  selectedDateKey: string;
  workoutMarks: CalendarDateMark[];
  primaryColor: string;
  primaryForegroundColor: string;
}): CalendarMarkedDates {
  const markedDates: CalendarMarkedDates = {};

  for (const { dateKey, count } of workoutMarks) {
    markedDates[dateKey] = {
      dots: Array.from({ length: Math.min(count, 3) }, (_, index) => ({
        key: `${dateKey}-${index}`,
        color: primaryColor,
        selectedDotColor: primaryForegroundColor
      }))
    };
  }

  if (selectedDateKey) {
    markedDates[selectedDateKey] = {
      ...(markedDates[selectedDateKey] ?? {}),
      selected: true
    };
  }

  return markedDates;
}

export function isDateInMonth(dateKey: string, monthKey: string): boolean {
  return dateKey.startsWith(`${monthKey}-`);
}

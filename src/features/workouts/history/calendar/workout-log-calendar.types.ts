export interface CalendarMonth {
  dateKey: string;
  days: CalendarDay[];
  monthKey: string;
  title: string;
}

export interface CalendarDay {
  dateKey: string;
  dayOfMonth: number;
  isInMonth: boolean;
}

export type CalendarMarkedDates = Record<string, CalendarMarkedDate>;

export interface CalendarMarkedDate {
  dots?: { key?: string; color: string; selectedDotColor?: string }[];
  selected?: boolean;
}

export interface CalendarDateMark {
  dateKey: string;
  count: number;
}

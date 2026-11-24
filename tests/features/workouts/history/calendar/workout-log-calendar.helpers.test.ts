import {
  getCalendarMonths,
  getMarkedDatesForMonth,
  getMonthIndexForDate,
  isDateInMonth
} from '@/src/features/workouts/history/calendar/workout-log-calendar.helpers';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';

// Consecutive calendar day keys computed in UTC, which has no daylight saving.
function consecutiveDateKeys(firstDateKey: string, count: number): string[] {
  const start = Date.parse(`${firstDateKey}T00:00:00Z`);

  return Array.from({ length: count }, (_, index) =>
    new Date(start + index * 86_400_000).toISOString().slice(0, 10)
  );
}

test('getCalendarMonths lays out six Monday-first weeks without skipping or repeating the spring-forward day', () => {
  const months = getCalendarMonths('2026-03-15', 1);

  expect(months.map(month => month.monthKey)).toEqual(['2026-02', '2026-03']);

  const march = months[1];

  expect(march.dateKey).toBe('2026-03-01');
  expect(march.days.map(day => day.dateKey)).toEqual(
    consecutiveDateKeys('2026-02-23', 42)
  );
  expect(march.days.map(day => day.dayOfMonth)).toEqual(
    march.days.map(day => Number(day.dateKey.slice(8)))
  );
  expect(
    march.days.filter(day => day.isInMonth).map(day => day.dateKey)
  ).toEqual(consecutiveDateKeys('2026-03-01', 31));
});

test('getCalendarMonths does not repeat the fall-back day', () => {
  const [november] = getCalendarMonths('2026-11-24', 0);

  expect(november.days.map(day => day.dateKey)).toEqual(
    consecutiveDateKeys('2026-10-26', 42)
  );
});

test('getMonthIndexForDate finds the month of a date key, falling back to the first month', () => {
  const months = getCalendarMonths('2026-03-15', 1);

  expect(getMonthIndexForDate(months, '2026-02-10')).toBe(0);
  expect(getMonthIndexForDate(months, '2026-03-31')).toBe(1);
  expect(getMonthIndexForDate(months, '2025-01-01')).toBe(0);
});

test('a late-evening workout is marked on its local day, not the next UTC day', () => {
  const startedAt = Date.UTC(2026, 2, 9, 3, 30);
  const dateKey = toLocalDateKey(startedAt);
  const [march] = getCalendarMonths('2026-03-08', 0);

  expect(dateKey).toBe('2026-03-08');
  expect(isDateInMonth({ dateKey, monthKey: march.monthKey })).toBe(true);
  expect(march.days.find(day => day.dateKey === dateKey)).toEqual({
    dateKey,
    dayOfMonth: 8,
    isInMonth: true
  });

  const markedDates = getMarkedDatesForMonth({
    selectedDateKey: dateKey,
    workoutMarks: [{ dateKey, count: 4 }],
    primaryColor: 'primary',
    primaryForegroundColor: 'foreground'
  });

  expect(Object.keys(markedDates)).toEqual(['2026-03-08']);
  expect(markedDates[dateKey].selected).toBe(true);
  expect(markedDates[dateKey].dots).toHaveLength(3);
});

test('isDateInMonth rejects a date key from another month', () => {
  expect(isDateInMonth({ dateKey: '2026-04-01', monthKey: '2026-03' })).toBe(
    false
  );
});

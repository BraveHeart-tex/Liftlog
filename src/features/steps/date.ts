import { toLocalDateKey } from '@/src/lib/utils/date';

interface LocalDayRange {
  dateKey: string;
  startAt: number;
  endAt: number;
}

function getLocalDayRange(dateKey: string): LocalDayRange {
  const [year, month, day] = dateKey.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  const endDate = new Date(year, month - 1, day + 1);

  return {
    dateKey,
    startAt: startDate.getTime(),
    endAt: endDate.getTime()
  };
}

export function getRecentLocalDayRanges(dayCount: number): LocalDayRange[] {
  const today = new Date();
  const ranges: LocalDayRange[] = [];

  for (let index = dayCount - 1; index >= 0; index -= 1) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - index
    );

    ranges.push(getLocalDayRange(toLocalDateKey(date.getTime())));
  }

  return ranges;
}

export function getTodayDateKey(): string {
  return toLocalDateKey(Date.now());
}

export function getMillisecondsUntilNextLocalDay(): number {
  const now = new Date();
  const nextDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  return Math.max(1000, nextDay.getTime() - now.getTime());
}

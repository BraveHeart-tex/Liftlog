import {
  getMillisecondsUntilNextLocalDay,
  getRecentLocalDayRanges,
  getTodayDateKey
} from '@/src/features/steps/steps-date.utils';

const HOUR = 3_600_000;

// Fixes "now" at a local time in the pinned America/New_York zone (EST UTC-5, EDT UTC-4).
function setNow(localTime: Date) {
  jest.useFakeTimers({ now: localTime });
}

afterEach(() => {
  jest.useRealTimers();
});

test('getRecentLocalDayRanges covers each day across a month boundary, oldest first', () => {
  setNow(new Date(2026, 2, 2, 12));

  expect(getRecentLocalDayRanges(4)).toEqual([
    {
      dateKey: '2026-02-27',
      startAt: Date.UTC(2026, 1, 27, 5),
      endAt: Date.UTC(2026, 1, 28, 5)
    },
    {
      dateKey: '2026-02-28',
      startAt: Date.UTC(2026, 1, 28, 5),
      endAt: Date.UTC(2026, 2, 1, 5)
    },
    {
      dateKey: '2026-03-01',
      startAt: Date.UTC(2026, 2, 1, 5),
      endAt: Date.UTC(2026, 2, 2, 5)
    },
    {
      dateKey: '2026-03-02',
      startAt: Date.UTC(2026, 2, 2, 5),
      endAt: Date.UTC(2026, 2, 3, 5)
    }
  ]);
});

test('getRecentLocalDayRanges ends each local day at the next local midnight across daylight-saving changes', () => {
  setNow(new Date(2026, 2, 9, 0, 30));
  const [springForward] = getRecentLocalDayRanges(2);

  expect(springForward.dateKey).toBe('2026-03-08');
  expect(springForward.endAt - springForward.startAt).toBe(23 * HOUR);

  setNow(new Date(2026, 10, 2, 0, 30));
  const [fallBack] = getRecentLocalDayRanges(2);

  expect(fallBack.dateKey).toBe('2026-11-01');
  expect(fallBack.endAt - fallBack.startAt).toBe(25 * HOUR);
});

test('getTodayDateKey uses the local day one minute before and after midnight', () => {
  setNow(new Date(2026, 1, 28, 23, 59));
  expect(getTodayDateKey()).toBe('2026-02-28');

  setNow(new Date(2026, 2, 1, 0, 1));
  expect(getTodayDateKey()).toBe('2026-03-01');
});

test.each([
  ['half a minute before midnight', new Date(2026, 2, 7, 23, 59, 30), 30_000],
  [
    'under a second before midnight, clamped',
    new Date(2026, 2, 7, 23, 59, 59, 500),
    1000
  ],
  ['the start of the spring-forward day', new Date(2026, 2, 8), 23 * HOUR],
  ['the start of the fall-back day', new Date(2026, 10, 1), 25 * HOUR]
])(
  'getMillisecondsUntilNextLocalDay waits until the next local midnight from %s',
  (_, localTime, expected) => {
    setNow(localTime);
    expect(getMillisecondsUntilNextLocalDay()).toBe(expected);
  }
);

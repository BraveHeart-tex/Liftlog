import {
  formatDuration,
  formatTimerDuration,
  formatWorkoutDate,
  getTimerParts,
  toLocalDateKey
} from '@/src/lib/utils/date.utils';

const MINUTE = 60_000;

// The app project pins America/New_York (tests/support/time-zone.global-setup.js):
// EST is UTC-5, EDT is UTC-4; 2026 springs forward on Mar 8 and falls back on Nov 1.
test('runs in the pinned daylight-saving time zone', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(
    'America/New_York'
  );
});

describe('toLocalDateKey', () => {
  test.each([
    [
      'before local midnight in winter',
      Date.UTC(2026, 0, 15, 4, 59),
      '2026-01-14'
    ],
    [
      'after local midnight in winter',
      Date.UTC(2026, 0, 15, 5, 1),
      '2026-01-15'
    ],
    [
      'at UTC midnight, still the previous local day',
      Date.UTC(2026, 0, 15),
      '2026-01-14'
    ],
    [
      'across the spring-forward gap',
      Date.UTC(2026, 2, 8, 6, 59),
      '2026-03-08'
    ],
    ['after the spring-forward gap', Date.UTC(2026, 2, 8, 7, 1), '2026-03-08'],
    [
      'before the first midnight on daylight time',
      Date.UTC(2026, 2, 9, 3, 59),
      '2026-03-08'
    ],
    [
      'after the first midnight on daylight time',
      Date.UTC(2026, 2, 9, 4, 1),
      '2026-03-09'
    ],
    [
      'before the last midnight on daylight time',
      Date.UTC(2026, 10, 1, 3, 59),
      '2026-10-31'
    ],
    [
      'after the last midnight on daylight time',
      Date.UTC(2026, 10, 1, 4, 1),
      '2026-11-01'
    ],
    [
      'during the repeated fall-back hour',
      Date.UTC(2026, 10, 1, 6, 30),
      '2026-11-01'
    ],
    [
      'before the first midnight on standard time',
      Date.UTC(2026, 10, 2, 4, 59),
      '2026-11-01'
    ],
    [
      'after the first midnight on standard time',
      Date.UTC(2026, 10, 2, 5, 1),
      '2026-11-02'
    ],
    ['across a year boundary', Date.UTC(2027, 0, 1, 4, 59), '2026-12-31']
  ])('keys the local day %s', (_, timestamp, expected) => {
    expect(toLocalDateKey(timestamp)).toBe(expected);
  });
});

test('formatWorkoutDate formats the local day, not the UTC day', () => {
  const lateLocalEvening = Date.UTC(2026, 2, 9, 3, 59);

  for (const format of ['short', 'compact', 'full'] as const) {
    expect(formatWorkoutDate(lateLocalEvening, format)).toBe(
      formatWorkoutDate(new Date(2026, 2, 8, 12).getTime(), format)
    );
    expect(formatWorkoutDate(lateLocalEvening, format)).not.toBe(
      formatWorkoutDate(new Date(2026, 2, 9, 12).getTime(), format)
    );
  }
});

describe('formatDuration', () => {
  test.each([
    ['an unfinished workout', null, '—'],
    ['zero time', 0, '< 1 min'],
    ['a completion before the start', -MINUTE, '< 1 min'],
    ['under half a minute', 29_000, '< 1 min'],
    ['half a minute, rounded up', 30_000, '1 min'],
    ['under an hour', 59 * MINUTE, '59 min'],
    ['minutes that round up to an hour', 59.5 * MINUTE, '1 hr'],
    ['whole hours', 120 * MINUTE, '2 hr'],
    ['hours and minutes', 125 * MINUTE, '2 hr 5 min'],
    ['many hours', 10 * 60 * MINUTE + MINUTE, '10 hr 1 min']
  ])('formats %s', (_, durationMs, expected) => {
    const startedAt = Date.UTC(2026, 2, 8, 6, 30);

    expect(
      formatDuration({
        startedAt,
        completedAt: durationMs === null ? null : startedAt + durationMs
      })
    ).toBe(expected);
  });

  test('measures elapsed time across the spring-forward gap', () => {
    expect(
      formatDuration({
        startedAt: new Date(2026, 2, 8, 1, 30).getTime(),
        completedAt: new Date(2026, 2, 8, 3, 30).getTime()
      })
    ).toBe('1 hr');
  });
});

test.each([
  [0, { minutes: 0, seconds: 0 }],
  [59, { minutes: 0, seconds: 59 }],
  [61, { minutes: 1, seconds: 1 }],
  [3725, { minutes: 62, seconds: 5 }]
])('getTimerParts splits %i seconds without an hour part', (total, parts) => {
  expect(getTimerParts(total)).toEqual(parts);
});

test.each([
  [0, '0:00'],
  [-5, '0:00'],
  [9.9, '0:09'],
  [59, '0:59'],
  [60, '1:00'],
  [3599, '59:59'],
  [3600, '1:00:00'],
  [3725, '1:02:05'],
  [36_000, '10:00:00']
])('formatTimerDuration formats %d seconds as %s', (total, expected) => {
  expect(formatTimerDuration(total)).toBe(expected);
});

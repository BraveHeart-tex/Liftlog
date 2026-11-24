import {
  formatDurationMs,
  formatTime,
  getDurationMsParts
} from '@/src/lib/utils/format-time.utils';

test.each([
  [0, false, '0:00'],
  [5, true, '00:05'],
  [65, false, '1:05'],
  [600, true, '10:00'],
  [3725, false, '62:05']
])(
  'formatTime formats %i seconds (padded minutes: %s) as %s',
  (seconds, padMinutes, expected) => {
    expect(formatTime(seconds, { padMinutes })).toBe(expected);
  }
);

test.each([
  [0, { hours: 0, minutes: 0, seconds: 0, centiseconds: 0 }],
  [-50, { hours: 0, minutes: 0, seconds: 0, centiseconds: 0 }],
  [5, { hours: 0, minutes: 0, seconds: 0, centiseconds: 1 }],
  [59_994, { hours: 0, minutes: 0, seconds: 59, centiseconds: 99 }],
  [59_995, { hours: 0, minutes: 1, seconds: 0, centiseconds: 0 }],
  [3_723_456, { hours: 1, minutes: 2, seconds: 3, centiseconds: 46 }]
])(
  'getDurationMsParts splits %i ms, carrying rounded centiseconds',
  (ms, parts) => {
    expect(getDurationMsParts(ms)).toEqual(parts);
  }
);

test.each([
  [0, '0:00.00'],
  [61_005, '1:01.01'],
  [999_995, '16:40.00'],
  [3_599_990, '59:59.99'],
  [3_600_000, '1:00:00.00'],
  [3_723_456, '1:02:03.46'],
  [36_000_000, '10:00:00.00']
])('formatDurationMs formats %i ms as %s', (ms, expected) => {
  expect(formatDurationMs(ms)).toBe(expected);
});

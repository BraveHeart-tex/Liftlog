import {
  areSameTrackingValues,
  computeEstimated1RM,
  formatPersonalRecordValue,
  formatScore,
  formatTrackingValue,
  getPersonalRecordSnapshot,
  getSetScore,
  resolveTrackingType,
  type SetValues,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { setRow } from '@/tests/support/factories';

type ScoredSet = Parameters<typeof getSetScore>[1];

const emptySet: ScoredSet = {
  weightKg: null,
  reps: null,
  distanceMeters: null,
  durationMs: null,
  durationSeconds: null
};

describe('computeEstimated1RM', () => {
  test.each([
    ['uses the Epley formula rounded to centimes', 100, 10, 133.33],
    ['adds a thirtieth per rep for a single', 100, 1, 103.33],
    ['keeps zero weight at zero', 0, 5, 0]
  ])('%s', (_name, weightKg, reps, expected) => {
    expect(computeEstimated1RM({ weightKg, reps })).toBe(expected);
  });
});

describe('getSetScore', () => {
  test.each<[string, TrackingType, Partial<ScoredSet>, number | null]>([
    // weight_reps: estimated 1RM; bodyweight (0 kg) still scores
    [
      'weight_reps scores the estimated 1RM',
      'weight_reps',
      { weightKg: 50, reps: 8 },
      63.33
    ],
    [
      'weight_reps scores bodyweight sets at zero',
      'weight_reps',
      { weightKg: 0, reps: 10 },
      0
    ],
    [
      'weight_reps rejects zero reps',
      'weight_reps',
      { weightKg: 50, reps: 0 },
      null
    ],
    ['weight_reps rejects missing weight', 'weight_reps', { reps: 8 }, null],
    ['weight_reps rejects missing reps', 'weight_reps', { weightKg: 50 }, null],
    [
      'weight_reps rejects non-finite weight',
      'weight_reps',
      { weightKg: Number.NaN, reps: 8 },
      null
    ],
    // distance_time: meters per second
    [
      'distance_time scores meters per second',
      'distance_time',
      { distanceMeters: 1000, durationMs: 250_000 },
      4
    ],
    [
      'distance_time falls back to legacy seconds',
      'distance_time',
      { distanceMeters: 1000, durationSeconds: 250 },
      4
    ],
    [
      'distance_time prefers milliseconds over legacy seconds',
      'distance_time',
      { distanceMeters: 1000, durationMs: 500_000, durationSeconds: 250 },
      2
    ],
    [
      'distance_time rejects zero distance',
      'distance_time',
      { distanceMeters: 0, durationMs: 250_000 },
      null
    ],
    [
      'distance_time rejects missing time',
      'distance_time',
      { distanceMeters: 1000 },
      null
    ],
    // reps
    ['reps scores the rep count', 'reps', { reps: 12 }, 12],
    ['reps rejects zero reps', 'reps', { reps: 0 }, null],
    ['reps rejects missing reps', 'reps', {}, null],
    // reps_time: reps per second
    [
      'reps_time scores reps per second',
      'reps_time',
      { reps: 30, durationMs: 60_000 },
      0.5
    ],
    [
      'reps_time rejects zero time',
      'reps_time',
      { reps: 30, durationMs: 0 },
      null
    ],
    [
      'reps_time rejects missing reps',
      'reps_time',
      { durationMs: 60_000 },
      null
    ],
    // weight_time: kilograms per second
    [
      'weight_time scores kilograms per second',
      'weight_time',
      { weightKg: 20, durationMs: 40_000 },
      0.5
    ],
    [
      'weight_time rejects zero weight',
      'weight_time',
      { weightKg: 0, durationMs: 40_000 },
      null
    ],
    ['weight_time rejects missing time', 'weight_time', { weightKg: 20 }, null],
    // duration: milliseconds
    [
      'duration scores milliseconds',
      'duration',
      { durationMs: 60_000 },
      60_000
    ],
    [
      'duration converts legacy seconds',
      'duration',
      { durationSeconds: 90 },
      90_000
    ],
    ['duration rejects zero time', 'duration', { durationMs: 0 }, null],
    ['duration rejects missing time', 'duration', {}, null]
  ])('%s', (_name, trackingType, values, expected) => {
    expect(getSetScore(trackingType, { ...emptySet, ...values })).toBe(
      expected
    );
  });
});

describe('formatTrackingValue', () => {
  test.each<[string, TrackingType, SetValues, 'kg' | 'lb', string]>([
    [
      'weight_reps in kilograms',
      'weight_reps',
      { weightKg: 80, reps: 8 },
      'kg',
      '80 kg x 8'
    ],
    [
      'weight_reps converts to pounds',
      'weight_reps',
      { weightKg: 100, reps: 5 },
      'lb',
      '220.5 lb x 5'
    ],
    [
      'weight_reps fills missing values with zero',
      'weight_reps',
      {},
      'kg',
      '0 kg x 0'
    ],
    [
      'distance_time',
      'distance_time',
      { distanceMeters: 1000, durationMs: 510_000 },
      'kg',
      '1,000 m in 8:30.00'
    ],
    [
      'distance_time fills missing values',
      'distance_time',
      {},
      'kg',
      '0 m in 0:00.00'
    ],
    ['reps', 'reps', { reps: 15 }, 'kg', '15 reps'],
    ['reps fills missing reps', 'reps', {}, 'kg', '0 reps'],
    [
      'reps_time',
      'reps_time',
      { reps: 12, durationMs: 40_000 },
      'kg',
      '12 reps in 0:40.00'
    ],
    [
      'weight_time',
      'weight_time',
      { weightKg: 80, durationMs: 40_000 },
      'kg',
      '80 kg for 0:40.00'
    ],
    [
      'weight_time fills missing values',
      'weight_time',
      {},
      'lb',
      '0 lb for 0:00.00'
    ],
    ['duration', 'duration', { durationMs: 3_723_450 }, 'kg', '1:02:03.45'],
    ['duration fills missing time', 'duration', {}, 'kg', '0:00.00']
  ])('%s', (_name, trackingType, values, unit, expected) => {
    expect(formatTrackingValue(trackingType, values, unit)).toBe(expected);
  });
});

describe('formatScore', () => {
  test.each<[string, TrackingType, number, 'kg' | 'lb', string]>([
    [
      'weight_reps shows the estimated 1RM in the weight unit',
      'weight_reps',
      100,
      'lb',
      '220.5 lb'
    ],
    [
      'distance_time shows meters per second',
      'distance_time',
      3.456,
      'kg',
      '3.46 m/s'
    ],
    ['reps shows whole reps', 'reps', 12, 'kg', '12 reps'],
    [
      'reps_time converts reps per second to per minute',
      'reps_time',
      0.5,
      'kg',
      '30 reps/min'
    ],
    [
      'weight_time converts kilograms per second to per minute',
      'weight_time',
      0.5,
      'kg',
      '30 kg/min'
    ],
    ['duration shows the time', 'duration', 90_000, 'kg', '1:30.00']
  ])('%s', (_name, trackingType, score, unit, expected) => {
    expect(formatScore(trackingType, score, unit)).toBe(expected);
  });
});

describe('personal records', () => {
  test('formats a personal record from legacy seconds', () => {
    expect(
      formatPersonalRecordValue(
        { ...emptySet, trackingType: 'duration', durationSeconds: 90 },
        'kg'
      )
    ).toBe('1:30.00');
  });

  test('formats an unknown tracking type as weight and reps', () => {
    expect(
      formatPersonalRecordValue(
        { ...emptySet, trackingType: 'retired', weightKg: 60, reps: 5 },
        'kg'
      )
    ).toBe('60 kg x 5');
  });

  test('stores the estimated 1RM only for weight_reps', () => {
    const set = setRow({ weightKg: 50, reps: 8 });

    expect(getPersonalRecordSnapshot('weight_reps', set, 63.33)).toEqual({
      trackingType: 'weight_reps',
      score: 63.33,
      weightKg: 50,
      reps: 8,
      distanceMeters: null,
      durationMs: null,
      durationSeconds: null,
      estimated1rm: 63.33
    });
    expect(
      getPersonalRecordSnapshot('reps', setRow({ weightKg: null, reps: 8 }), 8)
        .estimated1rm
    ).toBe(0);
  });

  test('derives both duration columns from legacy seconds', () => {
    const snapshot = getPersonalRecordSnapshot(
      'duration',
      setRow({ weightKg: null, reps: null, durationSeconds: 90 }),
      90_000
    );

    expect(snapshot).toMatchObject({
      durationMs: 90_000,
      durationSeconds: 90
    });
  });
});

describe('tracking values', () => {
  test.each([
    ['falls back to weight_reps for null', null],
    ['falls back to weight_reps for an unknown value', 'unknown']
  ])('%s', (_name, value) => {
    expect(resolveTrackingType(value)).toBe('weight_reps');
  });

  test('keeps a known tracking type', () => {
    expect(resolveTrackingType('distance_time')).toBe('distance_time');
  });

  test('compares only the fields of the tracking type', () => {
    const left = setRow({ weightKg: 50, reps: 8 });
    const right = setRow({ weightKg: 60, reps: 8 });

    expect(areSameTrackingValues('reps', left, right)).toBe(true);
    expect(areSameTrackingValues('weight_reps', left, right)).toBe(false);
  });

  test('treats legacy seconds and milliseconds as the same time', () => {
    expect(
      areSameTrackingValues(
        'duration',
        setRow({ durationMs: 90_000 }),
        setRow({ durationSeconds: 90 })
      )
    ).toBe(true);
  });
});

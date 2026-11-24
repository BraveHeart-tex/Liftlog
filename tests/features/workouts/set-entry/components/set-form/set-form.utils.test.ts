import { TRACKING_TYPE_DEFINITIONS } from '@/src/features/progress/tracking.domain';
import {
  getHasSavedChanges,
  getInitialFieldValues,
  parseDurationMsInput,
  parseTrackingFieldValues
} from '@/src/features/workouts/set-entry/components/set-form/set-form.utils';
import { setRow } from '@/tests/support/factories';

const weightRepsFields = TRACKING_TYPE_DEFINITIONS.weight_reps.fields;
const distanceTimeFields = TRACKING_TYPE_DEFINITIONS.distance_time.fields;
const durationFields = TRACKING_TYPE_DEFINITIONS.duration.fields;

describe('parseDurationMsInput', () => {
  test.each([
    ['plain seconds', '45', 45_000],
    ['fractional seconds', '45.5', 45_500],
    ['a comma decimal', '1:30,5', 90_500],
    ['minutes and seconds', '1:30', 90_000],
    ['hours, minutes and seconds', '1:02:03', 3_723_000],
    ['hours beyond a day', '25:00:00', 90_000_000],
    ['milliseconds rounded to centiseconds', '0.123', 120]
  ])('accepts %s', (_name, input, expected) => {
    expect(parseDurationMsInput(input)).toBe(expected);
  });

  test.each([
    ['an empty string', ''],
    ['text', 'abc'],
    ['a negative value', '-5'],
    ['an empty part', '1::30'],
    ['a leading colon', ':30'],
    ['too many parts', '1:02:03:04'],
    ['seconds of 60 or more after minutes', '1:60'],
    ['minutes over 59 after hours', '1:60:00'],
    ['fractional minutes', '1.5:30'],
    ['negative minutes', '-1:30']
  ])('rejects %s', (_name, input) => {
    expect(parseDurationMsInput(input)).toBeUndefined();
  });
});

describe('parseTrackingFieldValues', () => {
  test('parses kilograms and reps', () => {
    expect(
      parseTrackingFieldValues(
        { weightKg: ' 80,5 ', reps: '8' },
        weightRepsFields,
        'kg'
      )
    ).toEqual({ weightKg: 80.5, reps: 8 });
  });

  test('converts pounds to kilograms', () => {
    const values = parseTrackingFieldValues(
      { weightKg: '100', reps: '5' },
      weightRepsFields,
      'lb'
    );

    expect(values?.weightKg).toBeCloseTo(45.359237, 6);
  });

  test('accepts zero weight for bodyweight sets', () => {
    expect(
      parseTrackingFieldValues(
        { weightKg: '0', reps: '10' },
        weightRepsFields,
        'kg'
      )
    ).toEqual({ weightKg: 0, reps: 10 });
  });

  test('parses distance and duration input', () => {
    expect(
      parseTrackingFieldValues(
        { distanceMeters: '1000', durationMs: '8:30' },
        distanceTimeFields,
        'kg'
      )
    ).toEqual({ distanceMeters: 1000, durationMs: 510_000 });
  });

  test.each<[string, Record<string, string>, typeof weightRepsFields]>([
    ['a missing field', { weightKg: '80' }, weightRepsFields],
    ['a blank field', { weightKg: '80', reps: '  ' }, weightRepsFields],
    ['non-numeric weight', { weightKg: '80kg', reps: '8' }, weightRepsFields],
    ['negative weight', { weightKg: '-5', reps: '8' }, weightRepsFields],
    ['zero reps', { weightKg: '80', reps: '0' }, weightRepsFields],
    ['infinite reps', { weightKg: '80', reps: 'Infinity' }, weightRepsFields],
    ['malformed duration', { durationMs: '1:75' }, durationFields],
    ['zero duration', { durationMs: '0' }, durationFields]
  ])('rejects %s', (_name, input, fields) => {
    expect(parseTrackingFieldValues(input, fields, 'kg')).toBeUndefined();
  });
});

describe('getInitialFieldValues', () => {
  test('formats stored values for editing', () => {
    expect(
      getInitialFieldValues(
        'distance_time',
        { distanceMeters: 1234.56, durationMs: 90_500 },
        'kg'
      )
    ).toEqual({ distanceMeters: '1234.6', durationMs: '1:30.50' });
  });

  test('formats weight in the weight unit and skips missing values', () => {
    expect(
      getInitialFieldValues('weight_reps', { weightKg: 100 }, 'lb')
    ).toEqual({ weightKg: '220.5' });
  });

  test('parses its own duration output back to the stored value', () => {
    const fieldValues = getInitialFieldValues(
      'duration',
      { durationMs: 3_723_450 },
      'kg'
    );

    expect(parseTrackingFieldValues(fieldValues, durationFields, 'kg')).toEqual(
      { durationMs: 3_723_450 }
    );
  });
});

describe('getHasSavedChanges', () => {
  const set = setRow({ weightKg: 80, reps: 8 });
  const edit = { values: { weightKg: '80', reps: '8' } };

  test.each([
    ['no edit', undefined, { weightKg: 80, reps: 8 }, false],
    ['an invalid edit', edit, undefined, true],
    ['an edit matching the set', edit, { weightKg: 80, reps: 8 }, false],
    ['an edit changing the set', edit, { weightKg: 82.5, reps: 8 }, true]
  ])('reports %s', (_name, currentEdit, validatedValues, expected) => {
    expect(
      getHasSavedChanges({
        edit: currentEdit,
        fields: weightRepsFields,
        set,
        validatedValues
      })
    ).toBe(expected);
  });
});

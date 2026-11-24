import {
  convertWeightToKg,
  formatWeightForUnit
} from '@/src/lib/utils/weight.utils';

describe('convertWeightToKg', () => {
  test('keeps kilograms unchanged', () => {
    expect(convertWeightToKg(62.5, 'kg')).toBe(62.5);
  });

  test('converts pounds with the international pound', () => {
    expect(convertWeightToKg(100, 'lb')).toBeCloseTo(45.359237, 6);
  });
});

describe('formatWeightForUnit', () => {
  test.each([
    ['shows whole kilograms without decimals', 60, 'kg', '60'],
    ['rounds kilograms to one decimal', 62.25, 'kg', '62.3'],
    ['converts kilograms to pounds rounded to one decimal', 100, 'lb', '220.5'],
    ['shows zero', 0, 'lb', '0'],
    ['skips grouping by default', 1000, 'kg', '1000']
  ] as const)('%s', (_name, weightKg, unit, expected) => {
    expect(formatWeightForUnit(weightKg, unit)).toBe(expected);
  });

  test('applies grouping and fraction options', () => {
    expect(
      formatWeightForUnit(1234.567, 'kg', {
        useGrouping: true,
        maximumFractionDigits: 2
      })
    ).toBe('1,234.57');
  });

  // A pound entry stored as kilograms must display as the same pound value.
  test.each([0, 2.5, 45, 135, 225.5, 315, 1000.5])(
    'round-trips %s lb within display precision',
    pounds => {
      expect(formatWeightForUnit(convertWeightToKg(pounds, 'lb'), 'lb')).toBe(
        String(pounds)
      );
    }
  );

  test.each([0, 2.5, 62.5, 100, 142.5])(
    'round-trips %s kg within display precision',
    kilograms => {
      expect(
        formatWeightForUnit(convertWeightToKg(kilograms, 'kg'), 'kg')
      ).toBe(String(kilograms));
    }
  );
});

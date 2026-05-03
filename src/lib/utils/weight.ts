export type WeightUnit = 'kg' | 'lb';

const POUNDS_PER_KILOGRAM = 2.2046226218;

function convertWeightFromKg(weightKg: number, unit: WeightUnit) {
  if (unit === 'lb') {
    return weightKg * POUNDS_PER_KILOGRAM;
  }

  return weightKg;
}

export function convertWeightToKg(weight: number, unit: WeightUnit) {
  if (unit === 'lb') {
    return weight / POUNDS_PER_KILOGRAM;
  }

  return weight;
}

interface FormatWeightOptions {
  useGrouping?: boolean;
  maximumFractionDigits?: number;
}

function formatWeight(weight: number, options: FormatWeightOptions = {}) {
  const maximumFractionDigits =
    options.maximumFractionDigits ?? (Number.isInteger(weight) ? 0 : 1);

  return new Intl.NumberFormat(undefined, {
    useGrouping: options.useGrouping ?? false,
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(weight);
}

export function formatWeightForUnit(
  weightKg: number,
  unit: WeightUnit,
  options?: FormatWeightOptions
) {
  return formatWeight(convertWeightFromKg(weightKg, unit), options);
}

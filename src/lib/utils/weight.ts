export type WeightUnit = 'kg' | 'lb';

const POUNDS_PER_KILOGRAM = 2.2046226218;

export function convertWeightFromKg(weightKg: number, unit: WeightUnit) {
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

export function formatWeight(weight: number) {
  if (Number.isInteger(weight)) {
    return String(weight);
  }

  return weight.toFixed(1);
}

export function formatWeightForUnit(weightKg: number, unit: WeightUnit) {
  return formatWeight(convertWeightFromKg(weightKg, unit));
}

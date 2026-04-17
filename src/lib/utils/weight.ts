export function formatWeight(weightKg: number) {
  if (Number.isInteger(weightKg)) {
    return String(weightKg);
  }

  return weightKg.toFixed(1);
}

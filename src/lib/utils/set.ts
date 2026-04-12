import type { Set } from '@/src/db';

function formatWeight(weightKg: number) {
  if (Number.isInteger(weightKg)) {
    return String(weightKg);
  }

  return weightKg.toFixed(1);
}

export function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

export function formatCompletedSets(sets: Set[]) {
  if (sets.length === 0) {
    return undefined;
  }

  return sets
    .reduce<string[]>((parts, set, index) => {
      const previousSet = index > 0 ? sets[index - 1] : undefined;
      const hasSameWeightAsPrevious =
        previousSet && previousSet.weightKg === set.weightKg;

      if (hasSameWeightAsPrevious) {
        parts.push(String(set.reps));

        return parts;
      }

      parts.push(`${formatWeight(set.weightKg)} x ${set.reps}`);

      return parts;
    }, [])
    .join(', ');
}

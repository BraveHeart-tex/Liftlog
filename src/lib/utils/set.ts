import type { Set } from '@/src/db';
import { formatWeightForUnit, type WeightUnit } from '@/src/lib/utils/weight';

export function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

export function formatCompletedSets(sets: Set[], unit: WeightUnit = 'kg') {
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

      parts.push(
        `${formatWeightForUnit(set.weightKg, unit)} ${unit} x ${set.reps}`
      );

      return parts;
    }, [])
    .join(', ');
}

interface DisplaySetGroup {
  type: 'single' | 'range';
  startIndex: number;
  endIndex: number;
  weightKg: number;
  reps: number;
  setIds: string[];
}

interface GetDisplaySetGroupsOptions {
  personalRecordSetIds?: ReadonlySet<string>;
}

export function getDisplaySetGroups(
  sets: Set[],
  options: GetDisplaySetGroupsOptions = {}
): DisplaySetGroup[] {
  const groups: DisplaySetGroup[] = [];

  for (const set of sets) {
    const previousGroup = groups.at(-1);
    const setIndex =
      groups.reduce((count, group) => count + group.setIds.length, 0) + 1;
    const isCurrentPr = options.personalRecordSetIds?.has(set.id) ?? false;
    const isPreviousPr =
      previousGroup?.setIds.some(
        setId => options.personalRecordSetIds?.has(setId) ?? false
      ) ?? false;

    if (
      previousGroup &&
      previousGroup.weightKg === set.weightKg &&
      previousGroup.reps === set.reps &&
      isCurrentPr === isPreviousPr
    ) {
      previousGroup.endIndex = setIndex;
      previousGroup.setIds.push(set.id);
      continue;
    }

    groups.push({
      type: 'single',
      startIndex: setIndex,
      endIndex: setIndex,
      weightKg: set.weightKg,
      reps: set.reps,
      setIds: [set.id]
    });
  }

  return groups.map(group => ({
    ...group,
    type: group.setIds.length > 1 ? 'range' : 'single'
  }));
}

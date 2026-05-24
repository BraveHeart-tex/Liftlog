import type { Set } from '@/src/db';
import {
  areSameTrackingValues,
  formatTrackingValue,
  getSetValues,
  resolveTrackingType,
  type TrackingType
} from '@/src/features/progress/tracking';
import type { WeightUnit } from '@/src/lib/utils/weight';

export function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

export function formatCompletedSets(
  sets: Set[],
  unit: WeightUnit = 'kg',
  trackingType: TrackingType = 'weight_reps'
) {
  if (sets.length === 0) {
    return undefined;
  }

  const resolvedTrackingType = resolveTrackingType(trackingType);

  return sets
    .reduce<string[]>((parts, set, index) => {
      const previousSet = index > 0 ? sets[index - 1] : undefined;
      const hasSameWeightAsPrevious =
        previousSet &&
        resolvedTrackingType === 'weight_reps' &&
        previousSet.weightKg === set.weightKg;

      if (hasSameWeightAsPrevious) {
        parts.push(String(set.reps));

        return parts;
      }

      parts.push(
        formatTrackingValue(resolvedTrackingType, getSetValues(set), unit)
      );

      return parts;
    }, [])
    .join(', ');
}

interface DisplaySetGroup {
  type: 'single' | 'range';
  startIndex: number;
  endIndex: number;
  set: Set;
  setIds: string[];
}

interface GetDisplaySetGroupsOptions {
  personalRecordSetIds?: ReadonlySet<string>;
}

export function getDisplaySetGroups(
  sets: Set[],
  options: GetDisplaySetGroupsOptions = {},
  trackingType: TrackingType = 'weight_reps'
): DisplaySetGroup[] {
  const groups: DisplaySetGroup[] = [];
  const resolvedTrackingType = resolveTrackingType(trackingType);

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
      areSameTrackingValues(resolvedTrackingType, previousGroup.set, set) &&
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
      set,
      setIds: [set.id]
    });
  }

  return groups.map(group => ({
    ...group,
    type: group.setIds.length > 1 ? 'range' : 'single'
  }));
}

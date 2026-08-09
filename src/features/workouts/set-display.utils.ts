import type { Set } from '@/src/db';
import {
  areSameTrackingValues,
  formatTrackingValue,
  getSetValues,
  resolveTrackingType,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';

export function getWeightRepsVolume(sets: Set[]) {
  return sets.reduce((total, set) => {
    if (set.weightKg === null || set.reps === null) {
      return total;
    }

    return total + set.weightKg * set.reps;
  }, 0);
}

export function formatDisplaySetPosition(
  group: Pick<DisplaySetGroup, 'startIndex' | 'endIndex'>
) {
  return group.startIndex === group.endIndex
    ? `${group.startIndex}`
    : `${group.startIndex}-${group.endIndex}`;
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

export interface DisplaySetGroup {
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
  const personalRecordSetIds = options.personalRecordSetIds;
  let setIndex = 0;

  for (const set of sets) {
    setIndex += 1;
    const previousGroup = groups.at(-1);
    const isCurrentPr = personalRecordSetIds?.has(set.id) ?? false;
    const isPreviousPr = personalRecordSetIds
      ? (previousGroup?.setIds.some(setId => personalRecordSetIds.has(setId)) ??
        false)
      : false;

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

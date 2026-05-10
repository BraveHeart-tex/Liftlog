import type { Set, Workout } from '@/src/db/schema';
import { computeEstimated1RM } from '@/src/features/progress/repository';

const MIN_REPEAT_SET_COUNT = 2;

export interface ProgressionHistoryEntry {
  workout: Workout;
  sets: Set[];
}

export interface ProgressionSuggestionData {
  kind: 'increase-weight' | 'repeat-last';
  estimated1rmKg: number;
  estimated1rmDeltaKg: number | null;
  lastFourDeltaKg: number | null;
  previousWeightKg: number;
  previousReps: number;
  suggestedWeightKg: number;
  suggestedReps: number;
  repeatedSetCount: number;
}

function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

function getBestEstimated1RM(sets: Set[]) {
  return sets.reduce((best, set) => {
    const estimated1rm = computeEstimated1RM(set.weightKg, set.reps);

    return Math.max(best, estimated1rm);
  }, 0);
}

function areSameSetValues(left: Set, right: Set) {
  return left.weightKg === right.weightKg && left.reps === right.reps;
}

function getLastWorkingSet(sets: Set[]) {
  return sets[sets.length - 1];
}

export function getProgressionSuggestion(
  history: ProgressionHistoryEntry[],
  weightStepKg: number
): ProgressionSuggestionData | null {
  const entries = history
    .map(entry => ({
      workout: entry.workout,
      sets: getCompletedSets(entry.sets)
    }))
    .filter(entry => entry.sets.length > 0)
    .slice(0, 4);
  const latestEntry = entries[0];

  if (!latestEntry) {
    return null;
  }

  const firstSet = latestEntry.sets[0];
  const latestWorkingSet = getLastWorkingSet(latestEntry.sets);
  const remainingSets = latestEntry.sets.slice(1);
  const isRepeatablePattern = remainingSets.every(set =>
    areSameSetValues(firstSet, set)
  );
  const shouldIncreaseWeight =
    latestEntry.sets.length >= MIN_REPEAT_SET_COUNT && isRepeatablePattern;

  const latestBest1rm = getBestEstimated1RM(latestEntry.sets);
  const previousBest1rm = entries
    .slice(1)
    .reduce(
      (best, entry) => Math.max(best, getBestEstimated1RM(entry.sets)),
      0
    );
  const oldestEntry = entries[entries.length - 1];
  const oldestBest1rm = oldestEntry ? getBestEstimated1RM(oldestEntry.sets) : 0;

  return {
    kind: shouldIncreaseWeight ? 'increase-weight' : 'repeat-last',
    estimated1rmKg: latestBest1rm,
    estimated1rmDeltaKg:
      previousBest1rm > 0 ? latestBest1rm - previousBest1rm : null,
    lastFourDeltaKg:
      entries.length >= 2 && oldestBest1rm > 0
        ? latestBest1rm - oldestBest1rm
        : null,
    previousWeightKg: latestWorkingSet.weightKg,
    previousReps: latestWorkingSet.reps,
    suggestedWeightKg: shouldIncreaseWeight
      ? firstSet.weightKg + weightStepKg
      : latestWorkingSet.weightKg,
    suggestedReps: shouldIncreaseWeight ? firstSet.reps : latestWorkingSet.reps,
    repeatedSetCount: latestEntry.sets.length
  };
}

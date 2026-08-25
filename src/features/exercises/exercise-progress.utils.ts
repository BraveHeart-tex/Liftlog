import type { ExerciseProgressPoint } from '@/src/features/exercises/exercise.types';
import {
  formatScore,
  getSetScore,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import type { Set, Workout } from '@/src/db/schema';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';

export interface ExerciseHistoryProgressEntry {
  workout: Workout;
  sets: Set[];
}

export function buildExerciseProgressPoints(
  history: ExerciseHistoryProgressEntry[],
  trackingType: TrackingType,
  weightUnit: WeightUnit
): ExerciseProgressPoint[] {
  return [...history].reverse().flatMap(entry => {
    const bestScore = entry.sets.reduce<number | null>((best, set) => {
      const score = getSetScore(trackingType, set);

      if (score === null) {
        return best;
      }

      return best === null ? score : Math.max(best, score);
    }, null);

    if (bestScore === null) {
      return [];
    }

    return {
      workoutId: entry.workout.id,
      date: entry.workout.startedAt,
      value: bestScore,
      valueLabel: formatScore(trackingType, bestScore, weightUnit)
    };
  });
}

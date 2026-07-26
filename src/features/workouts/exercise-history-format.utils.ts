import type { Set } from '@/src/db';
import {
  formatScore,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { getWeightRepsVolume } from '@/src/features/workouts/set-display.utils';
import {
  formatWeightForUnit,
  type WeightUnit
} from '@/src/lib/utils/weight.utils';

function formatSignedScore(
  trackingType: TrackingType,
  value: number,
  unit: WeightUnit
) {
  const formattedValue = formatScore(trackingType, Math.abs(value), unit);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';

  return `${sign}${formattedValue}`;
}

export function formatRollingProgression(
  trackingType: TrackingType,
  delta: number,
  weightUnit: WeightUnit
) {
  return `${formatSignedScore(
    trackingType,
    delta,
    weightUnit
  )} vs prior 30 days`;
}

export function formatExerciseHistorySessionMetadata(
  sets: Set[],
  trackingType: TrackingType,
  weightUnit: WeightUnit
) {
  const setCount = `${sets.length} sets`;

  if (trackingType !== 'weight_reps') {
    return setCount;
  }

  const volume = getWeightRepsVolume(sets);
  const formattedVolume = formatWeightForUnit(volume, weightUnit, {
    useGrouping: true,
    maximumFractionDigits: 0
  });

  return `${setCount} · ${formattedVolume} ${weightUnit} total`;
}

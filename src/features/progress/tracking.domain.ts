import type { PersonalRecord, Set } from '@/src/db/schema';
import { formatDurationMs } from '@/src/lib/utils/format-time.utils';
import {
  formatWeightForUnit,
  type WeightUnit
} from '@/src/lib/utils/weight.utils';

export const TRACKING_TYPES = [
  'weight_reps',
  'distance_time',
  'reps',
  'reps_time',
  'weight_time'
] as const;

export type TrackingType = (typeof TRACKING_TYPES)[number];

export interface SetValues {
  weightKg?: number;
  reps?: number;
  distanceMeters?: number;
  durationMs?: number;
}

export interface TrackingFieldDefinition {
  key: keyof SetValues;
  label: string;
  unitLabel?: string;
  keyboardType: 'decimal-pad' | 'number-pad';
  step: (weightUnit: WeightUnit) => number;
  minimum: number;
  integer?: boolean;
}

interface TrackingTypeDefinition {
  label: string;
  fields: TrackingFieldDefinition[];
  scoreLabel: string;
}

const trackingTypeSet = new Set<TrackingType>(TRACKING_TYPES);

export const TRACKING_TYPE_DEFINITIONS: Record<
  TrackingType,
  TrackingTypeDefinition
> = {
  weight_reps: {
    label: 'Weight and reps',
    scoreLabel: 'Est. 1RM',
    fields: [
      {
        key: 'weightKg',
        label: 'Weight',
        keyboardType: 'decimal-pad',
        step: unit => (unit === 'kg' ? 2.5 : 5),
        minimum: 0
      },
      {
        key: 'reps',
        label: 'Reps',
        unitLabel: 'reps',
        keyboardType: 'number-pad',
        step: () => 1,
        minimum: 1,
        integer: true
      }
    ]
  },
  distance_time: {
    label: 'Distance and time',
    scoreLabel: 'Speed',
    fields: [
      {
        key: 'distanceMeters',
        label: 'Distance',
        unitLabel: 'm',
        keyboardType: 'decimal-pad',
        step: () => 10,
        minimum: 0
      },
      {
        key: 'durationMs',
        label: 'Time',
        unitLabel: 'time',
        keyboardType: 'number-pad',
        step: () => 1000,
        minimum: 10,
        integer: true
      }
    ]
  },
  reps: {
    label: 'Reps',
    scoreLabel: 'Reps',
    fields: [
      {
        key: 'reps',
        label: 'Reps',
        unitLabel: 'reps',
        keyboardType: 'number-pad',
        step: () => 1,
        minimum: 1,
        integer: true
      }
    ]
  },
  reps_time: {
    label: 'Reps and time',
    scoreLabel: 'Reps/min',
    fields: [
      {
        key: 'reps',
        label: 'Reps',
        unitLabel: 'reps',
        keyboardType: 'number-pad',
        step: () => 1,
        minimum: 1,
        integer: true
      },
      {
        key: 'durationMs',
        label: 'Time',
        unitLabel: 'time',
        keyboardType: 'number-pad',
        step: () => 1000,
        minimum: 10,
        integer: true
      }
    ]
  },
  weight_time: {
    label: 'Weight and time',
    scoreLabel: 'Weight/min',
    fields: [
      {
        key: 'weightKg',
        label: 'Weight',
        keyboardType: 'decimal-pad',
        step: unit => (unit === 'kg' ? 2.5 : 5),
        minimum: 0
      },
      {
        key: 'durationMs',
        label: 'Time',
        unitLabel: 'time',
        keyboardType: 'number-pad',
        step: () => 1000,
        minimum: 10,
        integer: true
      }
    ]
  }
};

export function resolveTrackingType(
  value: string | null | undefined
): TrackingType {
  return value && trackingTypeSet.has(value as TrackingType)
    ? (value as TrackingType)
    : 'weight_reps';
}

export function computeEstimated1RM(weightKg: number, reps: number): number {
  const estimatedOneRepMax = weightKg * (1 + reps / 30);

  return roundScore(estimatedOneRepMax);
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}

function isPositiveNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function assertPositiveNumber(value: number | null | undefined): number | null {
  return isPositiveNumber(value) ? (value ?? null) : null;
}

function assertNonNegativeNumber(
  value: number | null | undefined
): number | null {
  return isNonNegativeNumber(value) ? (value ?? null) : null;
}

function getDurationMs(
  set: Pick<Set, 'durationMs' | 'durationSeconds'>
): number | null {
  if (isPositiveNumber(set.durationMs)) {
    return set.durationMs ?? null;
  }

  if (isPositiveNumber(set.durationSeconds)) {
    return (set.durationSeconds ?? 0) * 1000;
  }

  return null;
}

function getDurationSecondsFromMs(durationMs: number): number {
  return Math.round(durationMs / 1000);
}

export function getSetScore(
  trackingType: TrackingType,
  set: Pick<
    Set,
    'weightKg' | 'reps' | 'distanceMeters' | 'durationMs' | 'durationSeconds'
  >
): number | null {
  switch (trackingType) {
    case 'weight_reps': {
      const weightKg = assertNonNegativeNumber(set.weightKg);
      const reps = assertPositiveNumber(set.reps);

      if (weightKg === null || reps === null) {
        return null;
      }

      return computeEstimated1RM(weightKg, reps);
    }
    case 'distance_time': {
      const distanceMeters = assertPositiveNumber(set.distanceMeters);
      const durationMs = getDurationMs(set);

      if (distanceMeters === null || durationMs === null) {
        return null;
      }

      return roundScore(distanceMeters / (durationMs / 1000));
    }
    case 'reps': {
      const reps = assertPositiveNumber(set.reps);

      return reps;
    }
    case 'reps_time': {
      const reps = assertPositiveNumber(set.reps);
      const durationMs = getDurationMs(set);

      if (reps === null || durationMs === null) {
        return null;
      }

      return roundScore(reps / (durationMs / 1000));
    }
    case 'weight_time': {
      const weightKg = assertPositiveNumber(set.weightKg);
      const durationMs = getDurationMs(set);

      if (weightKg === null || durationMs === null) {
        return null;
      }

      return roundScore(weightKg / (durationMs / 1000));
    }
  }
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    useGrouping: true
  }).format(value);
}

export function formatTrackingValue(
  trackingType: TrackingType,
  set: SetValues,
  weightUnit: WeightUnit
) {
  const weight =
    set.weightKg === undefined
      ? undefined
      : `${formatWeightForUnit(set.weightKg, weightUnit)} ${weightUnit}`;
  const reps = set.reps === undefined ? undefined : `${set.reps} reps`;
  const distance =
    set.distanceMeters === undefined
      ? undefined
      : `${formatNumber(set.distanceMeters)} m`;
  const duration =
    set.durationMs === undefined ? undefined : formatDurationMs(set.durationMs);

  switch (trackingType) {
    case 'weight_reps':
      return `${weight ?? '0 ' + weightUnit} x ${set.reps ?? 0}`;
    case 'distance_time':
      return `${distance ?? '0 m'} in ${duration ?? '0:00.00'}`;
    case 'reps':
      return reps ?? '0 reps';
    case 'reps_time':
      return `${reps ?? '0 reps'} in ${duration ?? '0:00.00'}`;
    case 'weight_time':
      return `${weight ?? '0 ' + weightUnit} for ${duration ?? '0:00.00'}`;
  }
}

export function formatPersonalRecordValue(
  record: Pick<
    PersonalRecord,
    | 'trackingType'
    | 'weightKg'
    | 'reps'
    | 'distanceMeters'
    | 'durationMs'
    | 'durationSeconds'
  >,
  weightUnit: WeightUnit
) {
  const durationMs = getDurationMs(record);

  return formatTrackingValue(
    resolveTrackingType(record.trackingType),
    {
      weightKg: record.weightKg ?? undefined,
      reps: record.reps ?? undefined,
      distanceMeters: record.distanceMeters ?? undefined,
      durationMs: durationMs ?? undefined
    },
    weightUnit
  );
}

export function formatScore(
  trackingType: TrackingType,
  score: number,
  weightUnit: WeightUnit
) {
  switch (trackingType) {
    case 'weight_reps':
      return `${formatWeightForUnit(score, weightUnit)} ${weightUnit}`;
    case 'distance_time':
      return `${formatNumber(score, 2)} m/s`;
    case 'reps':
      return `${formatNumber(score, 0)} reps`;
    case 'reps_time':
      return `${formatNumber(score * 60, 1)} reps/min`;
    case 'weight_time':
      return `${formatWeightForUnit(score * 60, weightUnit)} ${weightUnit}/min`;
  }
}

export function getSetValues(set: Set): SetValues {
  const durationMs = getDurationMs(set);

  return {
    weightKg: set.weightKg ?? undefined,
    reps: set.reps ?? undefined,
    distanceMeters: set.distanceMeters ?? undefined,
    durationMs: durationMs ?? undefined
  };
}

export function areSameTrackingValues(
  trackingType: TrackingType,
  left: Set,
  right: Set
) {
  const leftValues = getSetValues(left);
  const rightValues = getSetValues(right);

  return TRACKING_TYPE_DEFINITIONS[trackingType].fields.every(
    field => leftValues[field.key] === rightValues[field.key]
  );
}

export function getPersonalRecordSnapshot(
  trackingType: TrackingType,
  set: Set,
  score: number
) {
  const durationMs = getDurationMs(set);

  return {
    trackingType,
    score,
    weightKg: set.weightKg,
    reps: set.reps,
    distanceMeters: set.distanceMeters,
    durationMs,
    durationSeconds:
      durationMs === null ? null : getDurationSecondsFromMs(durationMs),
    estimated1rm: trackingType === 'weight_reps' ? score : 0
  };
}

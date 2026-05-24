import type { PersonalRecord, Set } from '@/src/db/schema';
import { formatTime } from '@/src/lib/utils/format-time';
import { formatWeightForUnit, type WeightUnit } from '@/src/lib/utils/weight';

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
  durationSeconds?: number;
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

const trackingTypeSet = new Set<string>(TRACKING_TYPES);

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
        key: 'durationSeconds',
        label: 'Time',
        unitLabel: 'min:sec',
        keyboardType: 'number-pad',
        step: () => 5,
        minimum: 1,
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
        key: 'durationSeconds',
        label: 'Time',
        unitLabel: 'min:sec',
        keyboardType: 'number-pad',
        step: () => 5,
        minimum: 1,
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
        key: 'durationSeconds',
        label: 'Time',
        unitLabel: 'min:sec',
        keyboardType: 'number-pad',
        step: () => 5,
        minimum: 1,
        integer: true
      }
    ]
  }
};

export function isTrackingType(value: string): value is TrackingType {
  return trackingTypeSet.has(value);
}

export function resolveTrackingType(value: string | null | undefined) {
  return value && isTrackingType(value) ? value : 'weight_reps';
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

export function getSetScore(
  trackingType: TrackingType,
  set: Pick<Set, 'weightKg' | 'reps' | 'distanceMeters' | 'durationSeconds'>
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
      const durationSeconds = assertPositiveNumber(set.durationSeconds);

      if (distanceMeters === null || durationSeconds === null) {
        return null;
      }

      return roundScore(distanceMeters / durationSeconds);
    }
    case 'reps': {
      const reps = assertPositiveNumber(set.reps);

      return reps;
    }
    case 'reps_time': {
      const reps = assertPositiveNumber(set.reps);
      const durationSeconds = assertPositiveNumber(set.durationSeconds);

      if (reps === null || durationSeconds === null) {
        return null;
      }

      return roundScore(reps / durationSeconds);
    }
    case 'weight_time': {
      const weightKg = assertPositiveNumber(set.weightKg);
      const durationSeconds = assertPositiveNumber(set.durationSeconds);

      if (weightKg === null || durationSeconds === null) {
        return null;
      }

      return roundScore(weightKg / durationSeconds);
    }
  }
}

export function hasValidTrackingValues(
  trackingType: TrackingType,
  values: SetValues
) {
  return (
    getSetScore(trackingType, {
      weightKg: values.weightKg ?? null,
      reps: values.reps ?? null,
      distanceMeters: values.distanceMeters ?? null,
      durationSeconds: values.durationSeconds ?? null
    }) !== null
  );
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
    set.durationSeconds === undefined
      ? undefined
      : formatTime(set.durationSeconds);

  switch (trackingType) {
    case 'weight_reps':
      return `${weight ?? '0 ' + weightUnit} x ${set.reps ?? 0}`;
    case 'distance_time':
      return `${distance ?? '0 m'} in ${duration ?? '0:00'}`;
    case 'reps':
      return reps ?? '0 reps';
    case 'reps_time':
      return `${reps ?? '0 reps'} in ${duration ?? '0:00'}`;
    case 'weight_time':
      return `${weight ?? '0 ' + weightUnit} for ${duration ?? '0:00'}`;
  }
}

export function formatPersonalRecordValue(
  record: Pick<
    PersonalRecord,
    'trackingType' | 'weightKg' | 'reps' | 'distanceMeters' | 'durationSeconds'
  >,
  weightUnit: WeightUnit
) {
  return formatTrackingValue(
    resolveTrackingType(record.trackingType),
    {
      weightKg: record.weightKg ?? undefined,
      reps: record.reps ?? undefined,
      distanceMeters: record.distanceMeters ?? undefined,
      durationSeconds: record.durationSeconds ?? undefined
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
  return {
    weightKg: set.weightKg ?? undefined,
    reps: set.reps ?? undefined,
    distanceMeters: set.distanceMeters ?? undefined,
    durationSeconds: set.durationSeconds ?? undefined
  };
}

export function areSameTrackingValues(
  trackingType: TrackingType,
  left: Set,
  right: Set
) {
  return TRACKING_TYPE_DEFINITIONS[trackingType].fields.every(
    field => left[field.key] === right[field.key]
  );
}

export function getPersonalRecordSnapshot(
  trackingType: TrackingType,
  set: Set,
  score: number
) {
  return {
    trackingType,
    score,
    weightKg: set.weightKg,
    reps: set.reps,
    distanceMeters: set.distanceMeters,
    durationSeconds: set.durationSeconds,
    estimated1rm: trackingType === 'weight_reps' ? score : 0
  };
}

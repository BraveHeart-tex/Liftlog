import type { Set } from '@/src/db/schema';
import {
  TRACKING_TYPE_DEFINITIONS,
  formatTrackingValue,
  getSetValues,
  type SetValues,
  type TrackingFieldDefinition,
  type TrackingType
} from '@/src/features/progress/tracking';
import type { useSettings } from '@/src/features/settings/hooks';
import { convertWeightToKg, formatWeightForUnit } from '@/src/lib/utils/weight';
import { formatInputNumber } from './utils';

export function getFieldHeaderLabel(
  field: TrackingFieldDefinition,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  if (field.key === 'weightKg') {
    return weightUnit.toUpperCase();
  }

  return field.label;
}

export function parseTrackingFieldValues(
  fieldValues: Record<string, string>,
  fields: TrackingFieldDefinition[],
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  const values: SetValues = {};

  for (const field of fields) {
    const value = parseFieldValue(
      field,
      fieldValues[field.key] ?? '',
      weightUnit
    );

    if (value === undefined || value < field.minimum) {
      return undefined;
    }

    if (field.integer && !Number.isInteger(value)) {
      return undefined;
    }

    values[field.key] = value;
  }

  return values;
}

export function getInitialFieldValues(
  trackingType: TrackingType,
  values: SetValues,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  const nextValues: Record<string, string> = {};

  for (const field of TRACKING_TYPE_DEFINITIONS[trackingType].fields) {
    const value = values[field.key];

    if (value !== undefined) {
      nextValues[field.key] = formatFieldValue(field, value, weightUnit);
    }
  }

  return nextValues;
}

export function getHasSavedChanges(
  edit: { values: Record<string, string> } | undefined,
  fields: TrackingFieldDefinition[],
  set: Set,
  validatedValues: SetValues | undefined
) {
  if (!edit) {
    return false;
  }

  if (!validatedValues) {
    return true;
  }

  return !areSetValuesEqual(fields, validatedValues, getSetValues(set));
}

export function areSetValuesEqual(
  fields: TrackingFieldDefinition[],
  left: SetValues,
  right: SetValues
) {
  return fields.every(field => left[field.key] === right[field.key]);
}

function parseFieldValue(
  field: TrackingFieldDefinition,
  value: string,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return undefined;
  }

  if (field.key === 'durationSeconds' && trimmedValue.includes(':')) {
    const [minutesValue, secondsValue] = trimmedValue.split(':');
    const minutes = Number(minutesValue);
    const seconds = Number(secondsValue);

    if (
      !Number.isInteger(minutes) ||
      !Number.isInteger(seconds) ||
      minutes < 0 ||
      seconds < 0 ||
      seconds > 59
    ) {
      return undefined;
    }

    return minutes * 60 + seconds;
  }

  const parsedValue = Number(trimmedValue.replace(',', '.'));

  if (!Number.isFinite(parsedValue)) {
    return undefined;
  }

  if (field.key === 'weightKg') {
    return convertWeightToKg(parsedValue, weightUnit);
  }

  return field.integer ? Math.round(parsedValue) : parsedValue;
}

function formatFieldValue(
  field: TrackingFieldDefinition,
  value: number,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  if (field.key === 'durationSeconds') {
    return formatTrackingValue(
      'reps_time',
      {
        reps: 1,
        durationSeconds: Math.round(value)
      },
      weightUnit
    ).replace('1 reps in ', '');
  }

  if (field.key === 'weightKg') {
    return formatWeightForUnit(value, weightUnit);
  }

  return field.integer
    ? String(Math.round(value))
    : formatInputNumber(Math.round(value * 10) / 10);
}

import type { Set } from '@/src/db/schema';
import {
  TRACKING_TYPE_DEFINITIONS,
  getSetValues,
  type SetValues,
  type TrackingFieldDefinition,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import type { useSettings } from '@/src/features/settings/hooks/use-settings';
import {
  convertWeightToKg,
  formatWeightForUnit
} from '@/src/lib/utils/weight.utils';
import { formatInputNumber } from '@/src/features/workouts/components/workout-components.utils';
import { formatDurationMs } from '@/src/lib/utils/format-time.utils';

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

  if (field.key === 'durationMs') {
    return parseDurationMsInput(trimmedValue);
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

export function parseDurationMsInput(value: string) {
  const normalizedValue = value.replace(',', '.');
  const parts = normalizedValue.split(':');

  if (parts.length > 3 || parts.some(part => part.length === 0)) {
    return undefined;
  }

  const secondsValue = Number(parts.at(-1));

  if (!Number.isFinite(secondsValue) || secondsValue < 0) {
    return undefined;
  }

  const minutesValue = parts.length >= 2 ? Number(parts.at(-2)) : 0;
  const hoursValue = parts.length === 3 ? Number(parts[0]) : 0;

  if (
    !Number.isInteger(minutesValue) ||
    !Number.isInteger(hoursValue) ||
    minutesValue < 0 ||
    minutesValue > 59 ||
    hoursValue < 0 ||
    (parts.length > 1 && secondsValue >= 60)
  ) {
    return undefined;
  }

  const totalMs =
    hoursValue * 3600000 +
    minutesValue * 60000 +
    Math.round(secondsValue * 1000);

  return Math.round(totalMs / 10) * 10;
}

function formatFieldValue(
  field: TrackingFieldDefinition,
  value: number,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  if (field.key === 'durationMs') {
    return formatDurationMs(value);
  }

  if (field.key === 'weightKg') {
    return formatWeightForUnit(value, weightUnit);
  }

  return field.integer
    ? String(Math.round(value))
    : formatInputNumber(Math.round(value * 10) / 10);
}

import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db/schema';
import {
  TRACKING_TYPE_DEFINITIONS,
  formatTrackingValue,
  type SetValues,
  type TrackingFieldDefinition,
  type TrackingType
} from '@/src/features/progress/tracking';
import { useSettings } from '@/src/features/settings/hooks';
import { StepperButton } from '@/src/features/workouts/components/stepper-button';
import { convertWeightToKg, formatWeightForUnit } from '@/src/lib/utils/weight';
import { PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react-native';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { formatInputNumber } from './utils';

const inputClassName = 'text-body-medium text-foreground flex-1 px-3 py-3';

const inputContainerClassName =
  'border-border min-h-14 flex-row items-center rounded-lg border';

interface SetFormProps {
  trackingType: TrackingType;
  editingSet: Set | undefined;
  prefillValues?: SetValues & { requestId: number };
  onAddSet: (data: SetValues) => void;
  onUpdateSet: (data: SetValues & { setId: Set['id'] }) => void;
  onClear: () => void;
  onDeleteSet: (setId: Set['id']) => void;
}

export function SetForm({
  trackingType,
  editingSet,
  prefillValues,
  onAddSet,
  onUpdateSet,
  onClear,
  onDeleteSet
}: SetFormProps) {
  const { weightUnit } = useSettings();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isEditing = Boolean(editingSet);
  const trackingDefinition = TRACKING_TYPE_DEFINITIONS[trackingType];

  useLayoutEffect(() => {
    if (editingSet) {
      setFieldValues(
        getInitialFieldValues(
          trackingType,
          {
            weightKg: editingSet.weightKg ?? undefined,
            reps: editingSet.reps ?? undefined,
            distanceMeters: editingSet.distanceMeters ?? undefined,
            durationSeconds: editingSet.durationSeconds ?? undefined
          },
          weightUnit
        )
      );

      return;
    }

    setFieldValues({});
  }, [editingSet, trackingType, weightUnit]);

  useLayoutEffect(() => {
    if (editingSet || !prefillValues) {
      return;
    }

    setFieldValues(
      getInitialFieldValues(trackingType, prefillValues, weightUnit)
    );
  }, [editingSet, prefillValues, trackingType, weightUnit]);

  useEffect(() => {
    return () => {
      stopRepeatingStep();
    };
  }, []);

  const stopRepeatingStep = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  };

  const startRepeatingStep = (onStep: () => void) => {
    stopRepeatingStep();
    onStep();

    holdTimeoutRef.current = setTimeout(() => {
      repeatIntervalRef.current = setInterval(onStep, 120);
    }, 300);
  };

  const updateFieldValue = (field: TrackingFieldDefinition, delta: number) => {
    setFieldValues(currentValues => {
      const currentValue = currentValues[field.key] ?? '';
      const parsedValue = parseFieldValue(field, currentValue, weightUnit);
      const currentNumber = parsedValue ?? 0;
      const nextValue = Math.max(field.minimum, currentNumber + delta);

      return {
        ...currentValues,
        [field.key]: formatFieldValue(field, nextValue, weightUnit)
      };
    });
  };

  const handleClear = () => {
    setFieldValues({});
    onClear();
  };

  const handleDelete = () => {
    if (!editingSet) {
      return;
    }

    Alert.alert('Delete set?', 'This set will be removed from the workout.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeleteSet(editingSet.id)
      }
    ]);
  };

  const getValidatedValues = () => {
    const values: SetValues = {};

    for (const field of trackingDefinition.fields) {
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
  };

  return (
    <View>
      <View className="mt-2 gap-4">
        {trackingDefinition.fields.map(field => (
          <View key={field.key}>
            <Text variant="caption" tone="muted" className="mb-1">
              {field.label}
            </Text>
            <View className="flex-row items-center gap-2">
              <StepperButton
                label="-"
                accessibilityLabel={`Decrease ${field.label.toLowerCase()}`}
                onStep={() => updateFieldValue(field, -field.step(weightUnit))}
                onStartRepeating={startRepeatingStep}
                onStopRepeating={stopRepeatingStep}
              />

              <Input
                value={fieldValues[field.key] ?? ''}
                onChangeText={value =>
                  setFieldValues(currentValues => ({
                    ...currentValues,
                    [field.key]: value
                  }))
                }
                keyboardType={field.keyboardType}
                placeholder="0"
                className="flex-1"
                withContainerDefaults={false}
                containerClassName={inputContainerClassName}
                inputClassName={inputClassName}
                accessibilityLabel={`Next set ${field.label.toLowerCase()}`}
                rightIconContainerClassName="ml-0"
                rightIcon={
                  <Text variant="bodyMedium" tone="muted" className="pr-3">
                    {getFieldUnitLabel(field, weightUnit)}
                  </Text>
                }
              />

              <StepperButton
                label="+"
                accessibilityLabel={`Increase ${field.label.toLowerCase()}`}
                onStep={() => updateFieldValue(field, field.step(weightUnit))}
                onStartRepeating={startRepeatingStep}
                onStopRepeating={stopRepeatingStep}
                buttonClassName="border-primary"
                textClassName="text-primary"
              />
            </View>
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            leftIcon={
              <Icon
                icon={isEditing ? PencilIcon : PlusIcon}
                className="text-primary-foreground"
              />
            }
            onPress={() => {
              const data = getValidatedValues();

              if (!data) {
                return;
              }

              if (editingSet) {
                onUpdateSet({
                  setId: editingSet.id,
                  ...data
                });

                return;
              }

              onAddSet(data);
            }}
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </View>

        <View className="flex-1">
          <Button
            variant={'destructive'}
            size="sm"
            onPress={isEditing ? handleDelete : handleClear}
            leftIcon={
              <Icon
                icon={isEditing ? Trash2Icon : XIcon}
                className="text-danger"
              />
            }
            disabled={!isEditing && !getValidatedValues()}
          >
            {isEditing ? 'Delete' : 'Clear'}
          </Button>
        </View>
      </View>
    </View>
  );
}

function getInitialFieldValues(
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

function getFieldUnitLabel(
  field: TrackingFieldDefinition,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  return field.key === 'weightKg' ? weightUnit : field.unitLabel;
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

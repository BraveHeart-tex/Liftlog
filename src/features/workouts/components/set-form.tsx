import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db/schema';
import { useSettings } from '@/src/features/settings/hooks';
import { convertWeightToKg, formatWeightForUnit } from '@/src/lib/utils/weight';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import type { SetValues } from './types';
import { formatInputNumber } from './utils';

const inputClassName = 'text-body-medium text-foreground flex-1 px-3 py-3';

const inputContainerClassName =
  'border-border min-h-14 flex-row items-center rounded-lg border';

const stepperButtonClassName =
  'bg-secondary border-border h-14 w-14 items-center justify-center rounded-lg border';

const weightStepByUnit = {
  kg: 2.5,
  lb: 5
};

type SetFormProps = {
  editingSet: Set | undefined;
  onAddSet: (data: SetValues) => void;
  onUpdateSet: (data: SetValues & { setId: Set['id'] }) => void;
  onClear: () => void;
  onDeleteSet: (setId: Set['id']) => void;
};

export function SetForm({
  editingSet,
  onAddSet,
  onUpdateSet,
  onClear,
  onDeleteSet
}: SetFormProps) {
  const { weightUnit } = useSettings();
  const [weightValue, setWeightValue] = useState('');
  const [repsValue, setRepsValue] = useState('');
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isEditing = Boolean(editingSet);

  useEffect(() => {
    if (editingSet) {
      setWeightValue(formatWeightForUnit(editingSet.weightKg, weightUnit));
      setRepsValue(String(editingSet.reps));

      return;
    }

    setWeightValue('');
    setRepsValue('');
  }, [editingSet, weightUnit]);

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

  const updateWeightValue = (delta: number) => {
    setWeightValue(currentValue => {
      const parsedValue = Number(currentValue.trim().replace(',', '.'));
      const currentWeight = Number.isFinite(parsedValue) ? parsedValue : 0;
      const nextWeight = Math.max(0, currentWeight + delta);

      return formatInputNumber(Math.round(nextWeight * 10) / 10);
    });
  };

  const updateRepsValue = (delta: number) => {
    setRepsValue(currentValue => {
      const parsedValue = Number(currentValue.trim());
      const currentReps = Number.isFinite(parsedValue) ? parsedValue : 0;
      const nextReps = Math.max(1, Math.round(currentReps) + delta);

      return String(nextReps);
    });
  };

  const handleClear = () => {
    setWeightValue('');
    setRepsValue('');
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
    const trimmedWeight = weightValue.trim().replace(',', '.');
    const trimmedReps = repsValue.trim();
    const weight = Number(trimmedWeight);
    const reps = Number(trimmedReps);

    if (trimmedWeight.length === 0) {
      return undefined;
    }

    if (!Number.isFinite(weight) || weight < 0) {
      return undefined;
    }

    if (trimmedReps.length === 0) {
      return undefined;
    }

    if (!Number.isInteger(reps) || reps < 1) {
      return undefined;
    }

    return { weightKg: convertWeightToKg(weight, weightUnit), reps };
  };

  return (
    <View>
      <View className="mt-2 gap-4">
        <View>
          <Text variant="caption" tone="muted" className="mb-1">
            Weight ({weightUnit})
          </Text>
          <View className="flex-row items-center gap-2">
            <StepperButton
              label="-"
              accessibilityLabel="Decrease weight"
              onStep={() => updateWeightValue(-weightStepByUnit[weightUnit])}
              onStartRepeating={startRepeatingStep}
              onStopRepeating={stopRepeatingStep}
            />

            <Input
              value={weightValue}
              onChangeText={setWeightValue}
              keyboardType="decimal-pad"
              placeholder="0"
              className="flex-1"
              withContainerDefaults={false}
              containerClassName={inputContainerClassName}
              inputClassName={inputClassName}
              accessibilityLabel={`Next set weight in ${weightUnit}`}
              rightIconContainerClassName="ml-0"
              rightIcon={
                <Text variant="bodyMedium" tone="muted" className="pr-3">
                  {weightUnit}
                </Text>
              }
            />

            <StepperButton
              label="+"
              accessibilityLabel="Increase weight"
              onStep={() => updateWeightValue(weightStepByUnit[weightUnit])}
              onStartRepeating={startRepeatingStep}
              onStopRepeating={stopRepeatingStep}
            />
          </View>
        </View>

        <View>
          <Text variant="caption" tone="muted" className="mb-1">
            Reps
          </Text>
          <View className="flex-row items-center gap-2">
            <StepperButton
              label="-"
              accessibilityLabel="Decrease reps"
              onStep={() => updateRepsValue(-1)}
              onStartRepeating={startRepeatingStep}
              onStopRepeating={stopRepeatingStep}
            />

            <Input
              value={repsValue}
              onChangeText={setRepsValue}
              keyboardType="number-pad"
              placeholder="0"
              className="flex-1"
              withContainerDefaults={false}
              containerClassName={inputContainerClassName}
              inputClassName={inputClassName}
              accessibilityLabel="Next set reps"
              rightIconContainerClassName="ml-0"
              rightIcon={
                <Text variant="bodyMedium" tone="muted" className="pr-3">
                  reps
                </Text>
              }
            />

            <StepperButton
              label="+"
              accessibilityLabel="Increase reps"
              onStep={() => updateRepsValue(1)}
              onStartRepeating={startRepeatingStep}
              onStopRepeating={stopRepeatingStep}
            />
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            leftIcon={
              !isEditing ? (
                <Icon
                  icon={PlusIcon}
                  size={14}
                  className="text-primary-foreground"
                />
              ) : null
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
            variant={isEditing ? 'destructive' : 'secondary'}
            size="sm"
            onPress={isEditing ? handleDelete : handleClear}
          >
            {isEditing ? 'Delete' : 'Clear'}
          </Button>
        </View>
      </View>
    </View>
  );
}

type StepperButtonProps = {
  label: string;
  accessibilityLabel: string;
  onStep: () => void;
  onStartRepeating: (onStep: () => void) => void;
  onStopRepeating: () => void;
};

function StepperButton({
  label,
  accessibilityLabel,
  onStep,
  onStartRepeating,
  onStopRepeating
}: StepperButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => onStartRepeating(onStep)}
      onPressOut={onStopRepeating}
      className={stepperButtonClassName}
    >
      <Text variant="h3">{label}</Text>
    </Pressable>
  );
}

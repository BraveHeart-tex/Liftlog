import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db/schema';
import { colors } from '@/src/theme/tokens';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import type { SetValues } from './types';
import { formatInputNumber } from './utils';

const inputClassName =
  'text-body text-foreground border-border w-full rounded-lg border px-3 py-2';

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
  const [weightValue, setWeightValue] = useState('');
  const [repsValue, setRepsValue] = useState('');
  const isEditing = Boolean(editingSet);

  useEffect(() => {
    if (editingSet) {
      setWeightValue(formatInputNumber(editingSet.weightKg));
      setRepsValue(String(editingSet.reps));
      return;
    }

    setWeightValue('');
    setRepsValue('');
  }, [editingSet]);

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
    const weightKg = Number(trimmedWeight);
    const reps = Number(trimmedReps);

    if (trimmedWeight.length === 0) {
      return undefined;
    }

    if (!Number.isFinite(weightKg) || weightKg < 0) {
      return undefined;
    }

    if (trimmedReps.length === 0) {
      return undefined;
    }

    if (!Number.isInteger(reps) || reps < 1) {
      return undefined;
    }

    return { weightKg, reps };
  };

  return (
    <View>
      <Text variant="caption" tone="muted">
        {isEditing ? 'Edit set' : 'Next set'}
      </Text>

      <View className="mt-2 flex-row items-end gap-3">
        <View className="flex-1">
          <Text variant="caption" tone="muted" className="mb-1">
            Weight (kg)
          </Text>
          <TextInput
            value={weightValue}
            onChangeText={setWeightValue}
            keyboardType="decimal-pad"
            placeholder="kg"
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            accessibilityLabel="Next set weight in kilograms"
            className={inputClassName}
          />
        </View>

        <Text variant="caption" tone="muted" className="pb-3">
          x
        </Text>

        <View className="flex-1">
          <Text variant="caption" tone="muted" className="mb-1">
            Reps
          </Text>
          <TextInput
            value={repsValue}
            onChangeText={setRepsValue}
            keyboardType="number-pad"
            placeholder="reps"
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            accessibilityLabel="Next set reps"
            className={inputClassName}
          />
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
            className="w-full"
            onPress={isEditing ? handleDelete : handleClear}
          >
            {isEditing ? 'Delete' : 'Clear'}
          </Button>
        </View>
      </View>
    </View>
  );
}

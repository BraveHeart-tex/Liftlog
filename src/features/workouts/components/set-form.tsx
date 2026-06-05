import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db/schema';
import {
  TRACKING_TYPE_DEFINITIONS,
  formatTrackingValue,
  getSetValues,
  type SetValues,
  type TrackingFieldDefinition,
  type TrackingType
} from '@/src/features/progress/tracking';
import { useSettings } from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import { convertWeightToKg, formatWeightForUnit } from '@/src/lib/utils/weight';
import { CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { formatInputNumber } from './utils';

interface SetFormProps {
  trackingType: TrackingType;
  sets: Set[];
  previousSets: Set[];
  onAddSet: (data: SetValues) => void;
  onUpdateSet: (data: SetValues & { setId: Set['id'] }) => void;
  onDeleteSet: (setId: Set['id']) => void;
}

interface SetFormRow {
  key: string;
  set: Set | undefined;
  previousSet: Set | undefined;
  setNumber: number;
}

export function SetForm({
  trackingType,
  sets,
  previousSets,
  onAddSet,
  onUpdateSet,
  onDeleteSet
}: SetFormProps) {
  const { weightUnit } = useSettings();
  const trackingDefinition = TRACKING_TYPE_DEFINITIONS[trackingType];
  const [draftValuesByKey, setDraftValuesByKey] = useState<
    Record<string, Record<string, string>>
  >({});
  const [extraDraftRows, setExtraDraftRows] = useState(0);
  const [pendingCreateRowKeys, setPendingCreateRowKeys] = useState<
    globalThis.Set<string>
  >(() => new Set());
  const [committedRowKeys, setCommittedRowKeys] = useState<
    globalThis.Set<string>
  >(() => new Set());
  const [createdSetRowKeysById, setCreatedSetRowKeysById] = useState<
    Record<Set['id'], string>
  >({});
  const previousSetCountRef = useRef(sets.length);

  const pendingCreateRowKeyList = useMemo(
    () =>
      Array.from(pendingCreateRowKeys).sort(
        (firstKey, secondKey) =>
          getDraftIndex(firstKey) - getDraftIndex(secondKey)
      ),
    [pendingCreateRowKeys]
  );
  const optimisticCreatedRowCount = Math.min(
    Math.max(0, sets.length - previousSetCountRef.current),
    pendingCreateRowKeyList.length
  );
  const rows = useMemo(
    () =>
      Array.from(
        { length: sets.length + extraDraftRows - optimisticCreatedRowCount },
        (_, index) => {
          const set = sets[index];
          const optimisticCreatedIndex = index - previousSetCountRef.current;
          const key =
            set && optimisticCreatedIndex >= 0
              ? (pendingCreateRowKeyList[optimisticCreatedIndex] ??
                createdSetRowKeysById[set.id] ??
                set.id)
              : (set?.id ?? `draft-${index}`);

          return {
            key,
            set,
            previousSet: previousSets[index],
            setNumber: index + 1
          };
        }
      ),
    [
      createdSetRowKeysById,
      extraDraftRows,
      optimisticCreatedRowCount,
      pendingCreateRowKeyList,
      previousSets,
      sets
    ]
  );

  useEffect(() => {
    setDraftValuesByKey(currentValues => {
      let didChange = false;
      const nextValues = { ...currentValues };
      const validKeys = new Set(rows.map(row => row.key));

      for (const key of Object.keys(nextValues)) {
        if (!validKeys.has(key)) {
          delete nextValues[key];
          didChange = true;
        }
      }

      for (const row of rows) {
        if (!row.set || nextValues[row.key]) {
          continue;
        }

        nextValues[row.key] = getInitialFieldValues(
          trackingType,
          getSetValues(row.set),
          weightUnit
        );
        didChange = true;
      }

      return didChange ? nextValues : currentValues;
    });
  }, [rows, trackingType, weightUnit]);

  useEffect(() => {
    const previousSetCount = previousSetCountRef.current;
    const addedSetCount = sets.length - previousSetCount;

    previousSetCountRef.current = sets.length;

    if (addedSetCount <= 0 || pendingCreateRowKeys.size === 0) {
      return;
    }

    const consumedRowKeys = Array.from(pendingCreateRowKeys)
      .sort(
        (firstKey, secondKey) =>
          getDraftIndex(firstKey) - getDraftIndex(secondKey)
      )
      .slice(0, addedSetCount);
    const createdSetKeys = sets
      .slice(previousSetCount, previousSetCount + consumedRowKeys.length)
      .map(set => set.id);

    setExtraDraftRows(count => Math.max(0, count - consumedRowKeys.length));
    setPendingCreateRowKeys(currentKeys => {
      const nextKeys = new Set(currentKeys);

      for (const key of consumedRowKeys) {
        nextKeys.delete(key);
      }

      return nextKeys;
    });
    setCommittedRowKeys(currentKeys => {
      const nextKeys = new Set(currentKeys);

      for (const key of consumedRowKeys) {
        nextKeys.delete(key);
      }

      for (const key of createdSetKeys) {
        nextKeys.add(key);
      }

      return nextKeys;
    });
    setCreatedSetRowKeysById(currentKeysById => {
      const nextKeysById = { ...currentKeysById };

      for (let index = 0; index < createdSetKeys.length; index += 1) {
        nextKeysById[createdSetKeys[index]] = consumedRowKeys[index];
      }

      return nextKeysById;
    });
    setDraftValuesByKey(currentValues => {
      const nextValues = { ...currentValues };

      for (const key of consumedRowKeys) {
        delete nextValues[key];
      }

      return nextValues;
    });
  }, [pendingCreateRowKeys, sets]);

  const getRowFieldValues = (row: SetFormRow) => {
    if (draftValuesByKey[row.key]) {
      return draftValuesByKey[row.key];
    }

    if (!row.set) {
      return {};
    }

    return getInitialFieldValues(
      trackingType,
      getSetValues(row.set),
      weightUnit
    );
  };

  const getRowValidatedValues = (row: SetFormRow) => {
    return parseTrackingFieldValues(
      getRowFieldValues(row),
      trackingDefinition.fields,
      weightUnit
    );
  };

  const hasSavedRowChanges = (
    row: SetFormRow,
    values: SetValues | undefined
  ) => {
    if (!row.set) {
      return false;
    }

    if (!values) {
      return true;
    }

    const savedValues = getSetValues(row.set);

    return trackingDefinition.fields.some(field => {
      const currentValue = values[field.key];
      const savedValue = savedValues[field.key];

      if (currentValue === undefined && savedValue === undefined) {
        return false;
      }

      return currentValue !== savedValue;
    });
  };

  const updateFieldValue = (
    rowKey: string,
    field: TrackingFieldDefinition,
    value: string
  ) => {
    setCommittedRowKeys(currentKeys => {
      if (!currentKeys.has(rowKey)) {
        return currentKeys;
      }

      const nextKeys = new Set(currentKeys);

      nextKeys.delete(rowKey);

      return nextKeys;
    });
    setDraftValuesByKey(currentValues => ({
      ...currentValues,
      [rowKey]: {
        ...(currentValues[rowKey] ?? {}),
        [field.key]: value
      }
    }));
  };

  const handleCommitRow = (row: SetFormRow) => {
    if (pendingCreateRowKeys.has(row.key)) {
      return;
    }

    const values = getRowValidatedValues(row);

    if (!values) {
      return;
    }

    if (row.set) {
      setCommittedRowKeys(currentKeys => {
        const nextKeys = new Set(currentKeys);

        nextKeys.add(row.key);

        return nextKeys;
      });
      onUpdateSet({ setId: row.set.id, ...values });

      return;
    }

    setPendingCreateRowKeys(currentKeys => {
      const nextKeys = new Set(currentKeys);

      nextKeys.add(row.key);

      return nextKeys;
    });
    setCommittedRowKeys(currentKeys => {
      const nextKeys = new Set(currentKeys);

      nextKeys.add(row.key);

      return nextKeys;
    });
    onAddSet(values);
  };

  const handleDeleteRow = (set: Set) => {
    Alert.alert('Delete set?', 'This set will be removed from the workout.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeleteSet(set.id)
      }
    ]);
  };

  const handleDeleteDraftRow = (row: SetFormRow) => {
    setExtraDraftRows(count => Math.max(0, count - 1));
    setPendingCreateRowKeys(currentKeys => {
      if (!currentKeys.has(row.key)) {
        return currentKeys;
      }

      const nextKeys = new Set(currentKeys);

      nextKeys.delete(row.key);

      return nextKeys;
    });
    setCommittedRowKeys(currentKeys => {
      if (!currentKeys.has(row.key)) {
        return currentKeys;
      }

      const nextKeys = new Set(currentKeys);

      nextKeys.delete(row.key);

      return nextKeys;
    });
    setDraftValuesByKey(currentValues => {
      const nextValues = { ...currentValues };

      delete nextValues[row.key];

      return nextValues;
    });
  };

  const renderDeleteAction = (
    setNumber: number,
    onDelete: () => void,
    _progress: unknown,
    _translation: unknown,
    swipeable: SwipeableMethods
  ) => (
    <View className="h-full justify-center pl-2">
      <Button
        variant="destructive"
        size="icon"
        accessibilityLabel={`Delete set ${setNumber}`}
        className="border-danger/30 bg-danger/10 h-16 w-16 rounded-lg"
        onPress={() => {
          swipeable.close();
          onDelete();
        }}
      >
        <Icon icon={Trash2Icon} className="text-danger" size="md" />
      </Button>
    </View>
  );

  const handleAddDraftRow = () => {
    setExtraDraftRows(count => count + 1);
  };
  const hasRows = rows.length > 0;

  return (
    <View className="flex-1">
      {hasRows ? (
        <>
          <View className="flex-row items-center gap-2 px-1 pb-2">
            <HeaderCell className="w-10">Set</HeaderCell>
            <HeaderCell className="flex-[1.45]">Previous</HeaderCell>
            {trackingDefinition.fields.map(field => (
              <HeaderCell key={field.key} className="flex-1 text-center">
                {getFieldHeaderLabel(field, weightUnit)}
              </HeaderCell>
            ))}
            <View className="w-12 items-center">
              <Icon
                icon={CheckIcon}
                className="text-muted-foreground"
                size="sm"
              />
            </View>
          </View>

          <View className="gap-2">
            {rows.map(row => {
              const rowFieldValues = getRowFieldValues(row);
              const validatedValues = getRowValidatedValues(row);
              const isValid = Boolean(validatedValues);
              const isPendingCreate = pendingCreateRowKeys.has(row.key);
              const hasSavedChanges = hasSavedRowChanges(row, validatedValues);
              const isPersistedCommitted =
                row.set?.status === 'completed' && !hasSavedChanges;
              const isCommitted =
                committedRowKeys.has(row.key) ||
                isPendingCreate ||
                isPersistedCommitted;
              const rowContent = (
                <View className="bg-card min-h-16 flex-row items-center gap-2 rounded-lg px-3 py-2">
                  <View className="w-8 items-center">
                    <Text variant="bodyMedium">{row.setNumber}</Text>
                  </View>

                  <View className="min-w-0 flex-[1.45]">
                    <Text variant="small" tone="muted" numberOfLines={1}>
                      {row.previousSet
                        ? formatTrackingValue(
                            trackingType,
                            getSetValues(row.previousSet),
                            weightUnit
                          )
                        : '-'}
                    </Text>
                  </View>

                  {trackingDefinition.fields.map(field => (
                    <Input
                      key={field.key}
                      value={rowFieldValues[field.key] ?? ''}
                      onChangeText={value =>
                        updateFieldValue(row.key, field, value)
                      }
                      keyboardType={field.keyboardType}
                      placeholder="0"
                      withContainerDefaults={false}
                      editable={!isPendingCreate}
                      wrapperClassName="flex-1"
                      containerClassName={cn(
                        'bg-muted min-h-12 flex-row items-center rounded-lg border px-1',
                        isCommitted
                          ? 'border-success/40 bg-success/10'
                          : isValid
                            ? 'border-muted'
                            : 'border-transparent'
                      )}
                      inputClassName="text-body-medium flex-1 px-2 py-2"
                      textAlign="center"
                      accessibilityLabel={`Set ${row.setNumber} ${field.label.toLowerCase()}`}
                    />
                  ))}

                  <Button
                    variant={isValid ? 'secondary' : 'ghost'}
                    size="icon"
                    disabled={!isValid}
                    accessibilityLabel={`Save set ${row.setNumber}`}
                    className={cn(
                      'h-12 w-12',
                      isCommitted
                        ? 'border-success/40 bg-success/10'
                        : isValid && 'border-primary/30 bg-primary/10'
                    )}
                    onPress={() => handleCommitRow(row)}
                  >
                    <Icon
                      icon={CheckIcon}
                      className={cn(
                        isCommitted
                          ? 'text-success'
                          : isValid
                            ? 'text-primary'
                            : 'text-muted-foreground'
                      )}
                      size="md"
                    />
                  </Button>
                </View>
              );

              const handleDelete = row.set
                ? () => handleDeleteRow(row.set)
                : () => handleDeleteDraftRow(row);

              return (
                <ReanimatedSwipeable
                  key={row.key}
                  overshootRight={false}
                  containerStyle={{ borderRadius: 8, overflow: 'hidden' }}
                  renderRightActions={(progress, translation, swipeable) =>
                    renderDeleteAction(
                      row.setNumber,
                      handleDelete,
                      progress,
                      translation,
                      swipeable
                    )
                  }
                >
                  {rowContent}
                </ReanimatedSwipeable>
              );
            })}
          </View>

          <Button
            onPress={handleAddDraftRow}
            className="mt-4 bg-transparent"
            leftIcon={
              <Icon icon={PlusIcon} className="text-foreground" size="sm" />
            }
            variant="secondary"
          >
            <Text variant="bodyMedium">Add Set</Text>
          </Button>

          {sets.length > 0 ? (
            <Text variant="caption" tone="muted" className="mt-3 text-center">
              Swipe left on a row to delete it.
            </Text>
          ) : null}
        </>
      ) : (
        <View className="border-border bg-card min-h-48 items-center justify-center rounded-lg border border-dashed px-6 py-10">
          <Text variant="h3" className="text-center">
            No sets yet
          </Text>
          <Text variant="small" tone="muted" className="mt-2 text-center">
            Add your first set to start tracking this exercise.
          </Text>
          <Button
            className="mt-6 border-solid"
            leftIcon={
              <Icon
                icon={PlusIcon}
                className="text-primary-foreground"
                size="sm"
              />
            }
            onPress={handleAddDraftRow}
          >
            Add Set
          </Button>
        </View>
      )}
    </View>
  );
}

function HeaderCell({
  children,
  className
}: {
  children: string;
  className?: string;
}) {
  return (
    <Text variant="overline" tone="muted" className={className}>
      {children}
    </Text>
  );
}

function getFieldHeaderLabel(
  field: TrackingFieldDefinition,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  if (field.key === 'weightKg') {
    return weightUnit.toUpperCase();
  }

  return field.label;
}

function getDraftIndex(rowKey: string) {
  return Number(rowKey.replace('draft-', ''));
}

function parseTrackingFieldValues(
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

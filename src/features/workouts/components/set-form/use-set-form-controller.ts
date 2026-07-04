import type { Set } from '@/src/db/schema';
import {
  getSetValues,
  type SetValues,
  type TrackingFieldDefinition,
  type TrackingType
} from '@/src/features/progress/tracking';
import type { useSettings } from '@/src/features/settings/hooks';
import {
  areSetValuesEqual,
  getHasSavedChanges,
  getInitialFieldValues,
  parseDurationMsInput,
  parseTrackingFieldValues
} from '@/src/features/workouts/components/set-form/set-form-utils';
import type {
  ActiveDurationPickerState,
  DraftRowState,
  DraftSetFormRow,
  PersistedEditState,
  PersistedSetFormRow,
  SetFormRow
} from '@/src/features/workouts/components/set-form/set-form-types';
import { formatDurationMs } from '@/src/lib/utils/format-time';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';

interface UseSetFormControllerArgs {
  trackingType: TrackingType;
  trackingDefinition: {
    fields: TrackingFieldDefinition[];
  };
  weightUnit: ReturnType<typeof useSettings>['weightUnit'];
  sets: Set[];
  previousSets: Set[];
  onAddSet: (data: SetValues & { order: Set['order'] }) => Set | Promise<Set>;
  onUpdateSet: (
    data: SetValues & { setId: Set['id'] }
  ) => Set | undefined | Promise<Set | undefined>;
  onDeleteSet: (setId: Set['id']) => void | Promise<void>;
}

export function useSetFormController({
  trackingType,
  trackingDefinition,
  weightUnit,
  sets,
  previousSets,
  onAddSet,
  onUpdateSet,
  onDeleteSet
}: UseSetFormControllerArgs) {
  const [draftRows, setDraftRows] = useState<DraftRowState[]>([]);
  const [draftValuesByKey, setDraftValuesByKey] = useState<
    Record<string, Record<string, string>>
  >({});
  const [persistedEditsBySetId, setPersistedEditsBySetId] = useState<
    Record<Set['id'], PersistedEditState>
  >({});
  const [pendingDeleteSetIds, setPendingDeleteSetIds] = useState<
    globalThis.Set<Set['id']>
  >(() => new Set());
  const [pendingCopyRowKeys, setPendingCopyRowKeys] = useState<
    globalThis.Set<string>
  >(() => new Set());
  const [activeDurationPicker, setActiveDurationPicker] =
    useState<ActiveDurationPickerState | null>(null);
  const nextDraftIndexRef = useRef(0);
  const pendingCopyRef = useRef(false);

  const liveSetIds = useMemo(() => new Set(sets.map(set => set.id)), [sets]);
  const setById = useMemo(
    () => new Map(sets.map(set => [set.id, set])),
    [sets]
  );

  useEffect(() => {
    let removedDraftKeys: string[] = [];

    setDraftRows(currentRows => {
      const nextRows = currentRows.filter(row => {
        const isSynced =
          row.createdSetId !== undefined && liveSetIds.has(row.createdSetId);

        if (isSynced) {
          removedDraftKeys.push(row.key);
        }

        return !isSynced;
      });

      return nextRows.length === currentRows.length ? currentRows : nextRows;
    });

    if (removedDraftKeys.length > 0) {
      setDraftValuesByKey(currentValues => {
        const nextValues = { ...currentValues };

        for (const key of removedDraftKeys) {
          delete nextValues[key];
        }

        return nextValues;
      });
    }

    setPersistedEditsBySetId(currentEdits => {
      let didChange = false;
      const nextEdits: Record<Set['id'], PersistedEditState> = {};

      for (const [setId, edit] of Object.entries(currentEdits)) {
        const liveSet = setById.get(setId);

        if (!liveSet) {
          didChange = true;
          continue;
        }

        if (
          edit.savedValues &&
          (edit.phase === 'saving' || edit.phase === 'awaiting_sync') &&
          areSetValuesEqual(
            trackingDefinition.fields,
            edit.savedValues,
            getSetValues(liveSet)
          )
        ) {
          didChange = true;
          continue;
        }

        nextEdits[setId] = edit;
      }

      return didChange ? nextEdits : currentEdits;
    });

    setPendingDeleteSetIds(currentIds => {
      let didChange = false;
      const nextIds = new Set<Set['id']>();

      for (const setId of currentIds) {
        if (liveSetIds.has(setId)) {
          nextIds.add(setId);
          continue;
        }

        didChange = true;
      }

      return didChange ? nextIds : currentIds;
    });
  }, [liveSetIds, setById, trackingDefinition.fields]);

  const visiblePersistedSets = useMemo(
    () => sets.filter(set => !pendingDeleteSetIds.has(set.id)),
    [pendingDeleteSetIds, sets]
  );

  const visibleDraftRows = useMemo(
    () =>
      draftRows.filter(
        row =>
          !(row.createdSetId !== undefined && liveSetIds.has(row.createdSetId))
      ),
    [draftRows, liveSetIds]
  );

  const rows = useMemo<SetFormRow[]>(() => {
    const persistedRows: PersistedSetFormRow[] = visiblePersistedSets.map(
      (set, index) => {
        const edit = persistedEditsBySetId[set.id];
        const fieldValues =
          edit?.values ??
          getInitialFieldValues(trackingType, getSetValues(set), weightUnit);
        const validatedValues = parseTrackingFieldValues(
          fieldValues,
          trackingDefinition.fields,
          weightUnit
        );
        const hasSavedChanges = getHasSavedChanges(
          edit,
          trackingDefinition.fields,
          set,
          validatedValues
        );
        const isSaving =
          edit?.phase === 'saving' || edit?.phase === 'awaiting_sync';

        return {
          fieldValues,
          hasSavedChanges,
          isCommitted:
            isSaving || (set.status === 'completed' && !hasSavedChanges),
          isSaving,
          key: set.id,
          kind: 'persisted',
          order: set.order,
          phase: edit?.phase ?? 'editing',
          previousSet: previousSets[index],
          set,
          setNumber: index + 1,
          validatedValues
        };
      }
    );

    const draftRowsForView: DraftSetFormRow[] = visibleDraftRows.map(
      (draftRow, index) => {
        const fieldValues = draftValuesByKey[draftRow.key] ?? {};
        const validatedValues = parseTrackingFieldValues(
          fieldValues,
          trackingDefinition.fields,
          weightUnit
        );
        const isSaving =
          draftRow.phase === 'saving' || draftRow.phase === 'awaiting_sync';
        const order = sets.length + index;

        return {
          fieldValues,
          isCommitted: isSaving,
          isSaving,
          key: draftRow.key,
          kind: 'draft',
          order,
          phase: draftRow.phase,
          previousSet: previousSets[visiblePersistedSets.length + index],
          setNumber: visiblePersistedSets.length + index + 1,
          validatedValues
        };
      }
    );

    return [...persistedRows, ...draftRowsForView];
  }, [
    draftValuesByKey,
    persistedEditsBySetId,
    previousSets,
    sets.length,
    trackingDefinition.fields,
    trackingType,
    visibleDraftRows,
    visiblePersistedSets,
    weightUnit
  ]);

  const activeDurationRow = activeDurationPicker
    ? rows.find(row => row.key === activeDurationPicker.rowKey)
    : undefined;
  const activeDurationValueMs =
    activeDurationRow && activeDurationPicker
      ? (parseDurationMsInput(
          activeDurationRow.fieldValues[activeDurationPicker.field.key] ?? ''
        ) ?? 0)
      : 0;
  const hasPendingCopy = pendingCopyRowKeys.size > 0;

  const updateFieldValue = (
    row: SetFormRow,
    field: TrackingFieldDefinition,
    value: string
  ) => {
    if (row.kind === 'draft') {
      setDraftRows(currentRows =>
        currentRows.map(currentRow =>
          currentRow.key === row.key
            ? { ...currentRow, phase: 'editing' }
            : currentRow
        )
      );
      setDraftValuesByKey(currentValues => ({
        ...currentValues,
        [row.key]: {
          ...(currentValues[row.key] ?? {}),
          [field.key]: value
        }
      }));

      return;
    }

    setPersistedEditsBySetId(currentEdits => {
      const existingEdit = currentEdits[row.set.id];
      const baselineValues =
        existingEdit?.baselineValues ??
        getInitialFieldValues(trackingType, getSetValues(row.set), weightUnit);

      return {
        ...currentEdits,
        [row.set.id]: {
          baselineValues,
          phase: 'editing',
          values: {
            ...(existingEdit?.values ?? baselineValues),
            [field.key]: value
          }
        }
      };
    });
  };

  const getNextSetOrder = () =>
    rows.reduce((nextOrder, row) => Math.max(nextOrder, row.order + 1), 0);

  const commitRowValues = async (
    row: SetFormRow,
    validatedValues: SetValues,
    fieldValues: Record<string, string>
  ) => {
    if (row.isSaving) {
      return;
    }

    if (row.kind === 'persisted') {
      const baselineValues = getInitialFieldValues(
        trackingType,
        getSetValues(row.set),
        weightUnit
      );

      setPersistedEditsBySetId(currentEdits => ({
        ...currentEdits,
        [row.set.id]: {
          baselineValues,
          phase: 'saving',
          savedValues: validatedValues,
          values: fieldValues
        }
      }));

      try {
        const updatedSet = await Promise.resolve(
          onUpdateSet({ setId: row.set.id, ...validatedValues })
        );

        setPersistedEditsBySetId(currentEdits => {
          const existingEdit = currentEdits[row.set.id];

          if (!existingEdit) {
            return currentEdits;
          }

          if (!updatedSet) {
            const nextEdits = { ...currentEdits };

            delete nextEdits[row.set.id];

            return nextEdits;
          }

          return {
            ...currentEdits,
            [row.set.id]: {
              ...existingEdit,
              phase: 'awaiting_sync',
              savedValues: validatedValues
            }
          };
        });
      } catch (error) {
        console.error('Failed to update set', error);
        setPersistedEditsBySetId(currentEdits => {
          const existingEdit = currentEdits[row.set.id];

          if (!existingEdit) {
            return currentEdits;
          }

          return {
            ...currentEdits,
            [row.set.id]: {
              baselineValues: existingEdit.baselineValues,
              phase: 'error',
              values: existingEdit.values
            }
          };
        });
      }

      return;
    }

    setDraftRows(currentRows =>
      currentRows.map(currentRow =>
        currentRow.key === row.key
          ? { ...currentRow, phase: 'saving' }
          : currentRow
      )
    );

    try {
      const createdSet = await Promise.resolve(
        onAddSet({ ...validatedValues, order: row.order })
      );

      setDraftRows(currentRows =>
        currentRows.map(currentRow =>
          currentRow.key === row.key
            ? {
                ...currentRow,
                createdSetId: createdSet.id,
                phase: 'awaiting_sync'
              }
            : currentRow
        )
      );
    } catch (error) {
      console.error('Failed to add set', error);
      setDraftRows(currentRows =>
        currentRows.map(currentRow =>
          currentRow.key === row.key
            ? { ...currentRow, phase: 'error' }
            : currentRow
        )
      );
    }
  };

  const commitRow = async (row: SetFormRow) => {
    if (!row.validatedValues) {
      return;
    }

    await commitRowValues(row, row.validatedValues, row.fieldValues);
  };

  const copyRow = async (row: SetFormRow) => {
    if (
      row.isSaving ||
      hasPendingCopy ||
      pendingCopyRef.current ||
      !row.validatedValues
    ) {
      return;
    }

    pendingCopyRef.current = true;
    setPendingCopyRowKeys(currentKeys => {
      const nextKeys = new Set(currentKeys);

      nextKeys.add(row.key);

      return nextKeys;
    });

    try {
      await Promise.resolve(
        onAddSet({ ...row.validatedValues, order: getNextSetOrder() })
      );
    } catch (error) {
      console.error('Failed to copy set', error);
      Alert.alert('Could not copy set', 'Please try again.');
    } finally {
      pendingCopyRef.current = false;
      setPendingCopyRowKeys(currentKeys => {
        if (!currentKeys.has(row.key)) {
          return currentKeys;
        }

        const nextKeys = new Set(currentKeys);

        nextKeys.delete(row.key);

        return nextKeys;
      });
    }
  };

  const deletePersistedRow = (row: PersistedSetFormRow) => {
    if (row.isSaving) {
      return;
    }

    Alert.alert('Delete set?', 'This set will be removed from the workout.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setPendingDeleteSetIds(currentIds => {
            const nextIds = new Set(currentIds);

            nextIds.add(row.set.id);

            return nextIds;
          });

          void (async () => {
            try {
              await Promise.resolve(onDeleteSet(row.set.id));
            } catch (error) {
              console.error('Failed to delete set', error);
              setPendingDeleteSetIds(currentIds => {
                if (!currentIds.has(row.set.id)) {
                  return currentIds;
                }

                const nextIds = new Set(currentIds);

                nextIds.delete(row.set.id);

                return nextIds;
              });
            }
          })();
        }
      }
    ]);
  };

  const deleteDraftRow = (row: DraftSetFormRow) => {
    if (row.isSaving) {
      return;
    }

    setDraftRows(currentRows =>
      currentRows.filter(currentRow => currentRow.key !== row.key)
    );
    setDraftValuesByKey(currentValues => {
      const nextValues = { ...currentValues };

      delete nextValues[row.key];

      return nextValues;
    });
  };

  const deleteRow = (row: SetFormRow) => {
    if (row.kind === 'persisted') {
      deletePersistedRow(row);

      return;
    }

    deleteDraftRow(row);
  };

  const addDraftRow = () => {
    const nextDraftKey = `draft-${nextDraftIndexRef.current}`;

    nextDraftIndexRef.current += 1;
    setDraftRows(currentRows => [
      ...currentRows,
      { key: nextDraftKey, phase: 'editing' }
    ]);
  };

  const confirmDuration = (durationMs: number) => {
    if (!activeDurationPicker || !activeDurationRow) {
      return;
    }

    const formattedDuration = formatDurationMs(durationMs);
    const nextFieldValues = {
      ...activeDurationRow.fieldValues,
      [activeDurationPicker.field.key]: formattedDuration
    };
    const nextValidatedValues = parseTrackingFieldValues(
      nextFieldValues,
      trackingDefinition.fields,
      weightUnit
    );
    const canAutoCommitDuration =
      !activeDurationRow.isSaving &&
      (activeDurationRow.kind === 'draft' ||
        activeDurationRow.set.status !== 'completed');

    updateFieldValue(
      activeDurationRow,
      activeDurationPicker.field,
      formattedDuration
    );

    if (canAutoCommitDuration && nextValidatedValues) {
      void commitRowValues(
        activeDurationRow,
        nextValidatedValues,
        nextFieldValues
      );
    }
  };

  const openDurationPicker = (
    row: SetFormRow,
    field: TrackingFieldDefinition
  ) => {
    Keyboard.dismiss();
    setActiveDurationPicker({
      rowKey: row.key,
      field
    });
  };

  const closeDurationPicker = () => {
    setActiveDurationPicker(null);
  };

  return {
    rows,
    hasPendingCopy,
    activeDurationPicker,
    activeDurationValueMs,
    updateFieldValue,
    commitRow,
    copyRow,
    deleteRow,
    addDraftRow,
    openDurationPicker,
    closeDurationPicker,
    confirmDuration
  };
}

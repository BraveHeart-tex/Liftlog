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
import { CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import {
  areSetValuesEqual,
  getFieldHeaderLabel,
  getHasSavedChanges,
  getInitialFieldValues,
  parseTrackingFieldValues
} from './set-form-utils';

type RowPhase = 'editing' | 'saving' | 'awaiting_sync' | 'error';

interface SetFormProps {
  trackingType: TrackingType;
  sets: Set[];
  previousSets: Set[];
  onAddSet: (data: SetValues & { order: Set['order'] }) => Set | Promise<Set>;
  onUpdateSet: (
    data: SetValues & { setId: Set['id'] }
  ) => Set | undefined | Promise<Set | undefined>;
  onDeleteSet: (setId: Set['id']) => void | Promise<void>;
}

interface DraftRowState {
  key: string;
  phase: RowPhase;
  createdSetId?: Set['id'];
}

interface PersistedEditState {
  baselineValues: Record<string, string>;
  phase: RowPhase;
  savedValues?: SetValues;
  values: Record<string, string>;
}

interface BaseRowView {
  fieldValues: Record<string, string>;
  isCommitted: boolean;
  isSaving: boolean;
  order: Set['order'];
  previousSet: Set | undefined;
  setNumber: number;
  validatedValues: SetValues | undefined;
}

interface PersistedSetFormRow extends BaseRowView {
  hasSavedChanges: boolean;
  key: Set['id'];
  kind: 'persisted';
  phase: RowPhase;
  set: Set;
}

interface DraftSetFormRow extends BaseRowView {
  key: string;
  kind: 'draft';
  phase: RowPhase;
}

type SetFormRow = DraftSetFormRow | PersistedSetFormRow;

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
  const nextDraftIndexRef = useRef(0);

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

  const handleCommitRow = async (row: SetFormRow) => {
    if (row.isSaving || !row.validatedValues) {
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
          savedValues: row.validatedValues,
          values: row.fieldValues
        }
      }));

      try {
        const updatedSet = await Promise.resolve(
          onUpdateSet({ setId: row.set.id, ...row.validatedValues })
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
              savedValues: row.validatedValues
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
        onAddSet({ ...row.validatedValues, order: row.order })
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

  const handleDeletePersistedRow = (row: PersistedSetFormRow) => {
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

  const handleDeleteDraftRow = (row: DraftSetFormRow) => {
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
    const nextDraftKey = `draft-${nextDraftIndexRef.current}`;

    nextDraftIndexRef.current += 1;
    setDraftRows(currentRows => [
      ...currentRows,
      { key: nextDraftKey, phase: 'editing' }
    ]);
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
              const isValid = Boolean(row.validatedValues);
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
                      value={row.fieldValues[field.key] ?? ''}
                      onChangeText={value =>
                        updateFieldValue(row, field, value)
                      }
                      keyboardType={field.keyboardType}
                      placeholder="0"
                      withContainerDefaults={false}
                      editable={!row.isSaving}
                      wrapperClassName="flex-1"
                      containerClassName={cn(
                        'bg-muted min-h-12 flex-row items-center rounded-lg border px-1',
                        row.isCommitted
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
                    disabled={!isValid || row.isSaving}
                    accessibilityLabel={`Save set ${row.setNumber}`}
                    className={cn(
                      'h-12 w-12',
                      row.isCommitted
                        ? 'border-success/40 bg-success/10'
                        : isValid && 'border-primary/30 bg-primary/10'
                    )}
                    onPress={() => void handleCommitRow(row)}
                  >
                    <Icon
                      icon={CheckIcon}
                      className={cn(
                        row.isCommitted
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

              const handleDelete = () => {
                if (row.kind === 'persisted') {
                  handleDeletePersistedRow(row);

                  return;
                }

                handleDeleteDraftRow(row);
              };

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

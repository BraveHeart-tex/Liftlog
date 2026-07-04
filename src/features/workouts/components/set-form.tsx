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
import { SetDurationField } from '@/src/features/workouts/components/set-duration-field';
import { SetDurationPickerSheet } from '@/src/features/workouts/components/set-duration-picker-sheet';
import {
  areSetValuesEqual,
  getFieldHeaderLabel,
  getHasSavedChanges,
  getInitialFieldValues,
  parseDurationMsInput,
  parseTrackingFieldValues
} from '@/src/features/workouts/components/set-form-utils';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion';
import { cn } from '@/src/lib/utils/cn';
import { formatDurationMs } from '@/src/lib/utils/format-time';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { CheckIcon, CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Keyboard, View, type LayoutChangeEvent } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

type RowPhase = 'editing' | 'saving' | 'awaiting_sync' | 'error';

type FieldTone = 'neutral' | 'valid' | 'committed' | 'error';

const rowEntering = FadeInDown.duration(MOTION_DURATION_MS.standard);
const rowExiting = FadeOut.duration(MOTION_DURATION_MS.exit);
const rowLayout = LinearTransition.duration(MOTION_DURATION_MS.standard);

const lightFeedbackColors = {
  danger: '#e8294a',
  success: '#34c76a'
} as const;

const darkFeedbackColors = {
  danger: '#c41535',
  success: '#1f9e4a'
} as const;

interface SetFormProps {
  trackingType: TrackingType;
  sets: Set[];
  previousSets: Set[];
  enableStopwatch?: boolean;
  onRowFocus?: (rowKey: string) => void;
  onRowLayout?: (
    rowKey: string,
    layout: LayoutChangeEvent['nativeEvent']['layout']
  ) => void;
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

interface ActiveDurationPickerState {
  rowKey: string;
  field: TrackingFieldDefinition;
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
  enableStopwatch = false,
  onRowFocus,
  onRowLayout,
  onAddSet,
  onUpdateSet,
  onDeleteSet
}: SetFormProps) {
  const { weightUnit } = useSettings();
  const { colors, colorScheme } = useAppTheme();
  const trackingDefinition = TRACKING_TYPE_DEFINITIONS[trackingType];
  const feedbackColors =
    colorScheme === 'dark' ? darkFeedbackColors : lightFeedbackColors;
  const animatedFieldColors = useMemo<AnimatedFieldColors>(
    () => ({
      border: [
        'transparent',
        colors.primary,
        feedbackColors.success,
        feedbackColors.danger
      ],
      background: [
        colors.muted,
        `${colors.primary}1A`,
        `${feedbackColors.success}1A`,
        `${feedbackColors.danger}1A`
      ]
    }),
    [colors.muted, colors.primary, feedbackColors]
  );
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

  const handleCommitRow = async (row: SetFormRow) => {
    if (!row.validatedValues) {
      return;
    }

    await commitRowValues(row, row.validatedValues, row.fieldValues);
  };

  const handleCopyRow = async (row: SetFormRow) => {
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

  const renderRowActions = (
    setNumber: number,
    onCopy: () => void,
    onDelete: () => void,
    isCopyDisabled: boolean,
    _progress: unknown,
    _translation: unknown,
    swipeable: SwipeableMethods
  ) => (
    <View className="h-full flex-row items-center gap-2 pl-2">
      <Button
        variant="secondary"
        size="icon"
        disabled={isCopyDisabled}
        accessibilityLabel={`Copy set ${setNumber}`}
        className="border-primary/30 bg-primary/10 h-16 w-16 rounded-lg"
        onPress={() => {
          swipeable.close();
          onCopy();
        }}
      >
        <Icon
          as={CopyIcon}
          tone={isCopyDisabled ? 'mutedForeground' : 'primary'}
          size="md"
        />
      </Button>
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
        <Icon as={Trash2Icon} tone="danger" size="md" />
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

  const handleConfirmDuration = (durationMs: number) => {
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

  const handleOpenDurationPicker = (
    row: SetFormRow,
    field: TrackingFieldDefinition
  ) => {
    Keyboard.dismiss();
    setActiveDurationPicker({
      rowKey: row.key,
      field
    });
  };

  const getRowFieldTone = (row: SetFormRow, isValid: boolean): FieldTone => {
    if (row.phase === 'error') {
      return 'error';
    }

    if (row.isCommitted) {
      return 'committed';
    }

    return isValid ? 'valid' : 'neutral';
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
              <Icon as={CheckIcon} tone="mutedForeground" size="sm" />
            </View>
          </View>

          <View className="gap-2">
            {rows.map(row => {
              const isValid = Boolean(row.validatedValues);
              const fieldTone = getRowFieldTone(row, isValid);
              const isCopyDisabled = !isValid || row.isSaving || hasPendingCopy;
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

                  {trackingDefinition.fields.map(field =>
                    field.key === 'durationMs' ? (
                      <AnimatedFieldSurface
                        key={field.key}
                        tone={fieldTone}
                        colors={animatedFieldColors}
                        className="flex-1"
                      >
                        <SetDurationField
                          value={row.fieldValues[field.key] ?? ''}
                          placeholder="0:00.00"
                          disabled={row.isSaving}
                          isCommitted={row.isCommitted}
                          isValid={isValid}
                          surfaceClassName="border-transparent bg-transparent"
                          accessibilityLabel={`Set ${row.setNumber} ${field.label.toLowerCase()}`}
                          onPress={() => handleOpenDurationPicker(row, field)}
                        />
                      </AnimatedFieldSurface>
                    ) : (
                      <AnimatedFieldSurface
                        key={field.key}
                        tone={fieldTone}
                        colors={animatedFieldColors}
                        className="flex-1"
                      >
                        <Input
                          value={row.fieldValues[field.key] ?? ''}
                          onChangeText={value =>
                            updateFieldValue(row, field, value)
                          }
                          keyboardType={field.keyboardType}
                          placeholder="0"
                          withContainerDefaults={false}
                          editable={!row.isSaving}
                          onFocus={() => onRowFocus?.(row.key)}
                          containerClassName="min-h-12 flex-row items-center rounded-lg px-1"
                          inputClassName="text-body-medium flex-1 px-2 py-2"
                          textAlign="center"
                          accessibilityLabel={`Set ${row.setNumber} ${field.label.toLowerCase()}`}
                        />
                      </AnimatedFieldSurface>
                    )
                  )}

                  <AnimatedSaveButtonSurface
                    tone={fieldTone}
                    isCommitted={row.isCommitted}
                    colors={animatedFieldColors}
                  >
                    <Button
                      variant={isValid ? 'secondary' : 'ghost'}
                      size="icon"
                      disabled={!isValid || row.isSaving}
                      accessibilityLabel={`Save set ${row.setNumber}`}
                      className="h-12 w-12 border-transparent bg-transparent"
                      onPress={() => void handleCommitRow(row)}
                    >
                      <Icon
                        as={CheckIcon}
                        tone={
                          row.isCommitted
                            ? 'success'
                            : isValid
                              ? 'primary'
                              : 'mutedForeground'
                        }
                        size="md"
                      />
                    </Button>
                  </AnimatedSaveButtonSurface>
                </View>
              );

              const handleDelete = () => {
                if (row.kind === 'persisted') {
                  handleDeletePersistedRow(row);

                  return;
                }

                handleDeleteDraftRow(row);
              };

              const handleCopy = () => {
                void handleCopyRow(row);
              };

              return (
                <Animated.View
                  key={row.key}
                  entering={rowEntering}
                  exiting={rowExiting}
                  layout={rowLayout}
                  onLayout={event =>
                    onRowLayout?.(row.key, event.nativeEvent.layout)
                  }
                >
                  <ReanimatedSwipeable
                    overshootRight={false}
                    containerStyle={{ borderRadius: 8, overflow: 'hidden' }}
                    renderRightActions={(progress, translation, swipeable) =>
                      renderRowActions(
                        row.setNumber,
                        handleCopy,
                        handleDelete,
                        isCopyDisabled,
                        progress,
                        translation,
                        swipeable
                      )
                    }
                  >
                    {rowContent}
                  </ReanimatedSwipeable>
                </Animated.View>
              );
            })}
          </View>

          <Button
            onPress={handleAddDraftRow}
            className="mt-4 bg-transparent"
            leftIcon={<Icon as={PlusIcon} tone="foreground" size="sm" />}
            variant="secondary"
          >
            <Text variant="bodyMedium">Add Set</Text>
          </Button>

          {sets.length > 0 ? (
            <Text variant="caption" tone="muted" className="mt-3 text-center">
              Swipe left on a row to copy or delete it.
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
            leftIcon={<Icon as={PlusIcon} tone="primaryForeground" size="sm" />}
            onPress={handleAddDraftRow}
          >
            Add Set
          </Button>
        </View>
      )}
      <SetDurationPickerSheet
        isOpen={Boolean(activeDurationPicker)}
        valueMs={activeDurationValueMs}
        enableStopwatch={enableStopwatch}
        onClose={() => setActiveDurationPicker(null)}
        onConfirm={handleConfirmDuration}
      />
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

interface AnimatedFieldColors {
  background: [string, string, string, string];
  border: [string, string, string, string];
}

interface AnimatedFieldSurfaceProps {
  children: ReactNode;
  className?: string;
  colors: AnimatedFieldColors;
  tone: FieldTone;
}

const toneProgress: Record<FieldTone, number> = {
  neutral: 0,
  valid: 1,
  committed: 2,
  error: 3
};

function AnimatedFieldSurface({
  children,
  className,
  colors,
  tone
}: AnimatedFieldSurfaceProps) {
  const progress = useSharedValue(toneProgress[tone]);

  useEffect(() => {
    progress.value = withTiming(toneProgress[tone], {
      duration: MOTION_DURATION_MS.standard
    });
  }, [progress, tone]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1, 2, 3],
      colors.background
    ),
    borderColor: interpolateColor(progress.value, [0, 1, 2, 3], colors.border)
  }));

  return (
    <Animated.View
      className={cn('min-h-12 rounded-lg border', className)}
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedSaveButtonSurfaceProps {
  children: ReactNode;
  colors: AnimatedFieldColors;
  isCommitted: boolean;
  tone: FieldTone;
}

function AnimatedSaveButtonSurface({
  children,
  colors,
  isCommitted,
  tone
}: AnimatedSaveButtonSurfaceProps) {
  const previousIsCommitted = useRef(isCommitted);
  const progress = useSharedValue(toneProgress[tone]);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(toneProgress[tone], {
      duration: MOTION_DURATION_MS.standard
    });
  }, [progress, tone]);

  useEffect(() => {
    if (isCommitted && !previousIsCommitted.current) {
      scale.value = withSequence(
        withSpring(1.14, { damping: 10, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
    }

    previousIsCommitted.current = isCommitted;
  }, [isCommitted, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1, 2, 3],
      colors.background
    ),
    borderColor: interpolateColor(progress.value, [0, 1, 2, 3], colors.border),
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View
      className="h-12 w-12 rounded-lg border"
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  );
}

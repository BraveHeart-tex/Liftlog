import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import {
  ReorderableHandle,
  ReorderableList,
  type ReorderableListRenderItem
} from '@/src/components/ui/reorderable-list';
import type { WorkoutExercise } from '@/src/db/schema';
import { ActiveWorkoutExerciseActionsSheet } from '@/src/features/workouts/components/active-workout-exercise-actions-sheet';
import { ActiveWorkoutExerciseEditRow } from '@/src/features/workouts/components/active-workout-exercise-edit-row';
import { PairWithNextControl } from '@/src/features/workouts/components/pair-with-next-control';
import { SupersetExerciseGroup } from '@/src/features/workouts/components/superset-exercise-group';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/workout-components.types';
import {
  flattenSupersetBlocks,
  formatSupersetLabel,
  groupSupersetBlocks,
  linkAdjacentSupersetRows,
  normalizeSupersetRows,
  unlinkSupersetRows,
  type SupersetBlock
} from '@/src/features/workouts/superset.utils';
import { iconSizes } from '@/src/theme/sizes';
import { GripIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

type EditableWorkoutExerciseRow = WorkoutExerciseWithSets & {
  id: WorkoutExercise['id'];
  supersetId: WorkoutExercise['supersetId'];
};

interface ActiveWorkoutExerciseEditListProps {
  rows: WorkoutExerciseWithSets[];
  onChangeRows: (rows: Pick<WorkoutExercise, 'id' | 'supersetId'>[]) => void;
}

export const ActiveWorkoutExerciseEditList = memo(
  function ActiveWorkoutExerciseEditList({
    rows,
    onChangeRows
  }: ActiveWorkoutExerciseEditListProps) {
    const editableRows = useMemo<EditableWorkoutExerciseRow[]>(
      () =>
        rows.map(row => ({
          ...row,
          id: row.workoutExercise.id,
          supersetId: row.workoutExercise.supersetId
        })),
      [rows]
    );
    const blocks = useMemo(
      () => groupSupersetBlocks(editableRows),
      [editableRows]
    );
    const [orderedRows, setOrderedRows] = useState(blocks);
    const [selectedExerciseId, setSelectedExerciseId] =
      useState<WorkoutExercise['id']>();
    const rowIds = rows
      .map(r => `${r.workoutExercise.id}:${r.workoutExercise.supersetId ?? ''}`)
      .join(',');
    const shouldShowDragHandle = blocks.length > 1;
    const flatRows = useMemo(
      () => flattenSupersetBlocks(orderedRows),
      [orderedRows]
    );
    const supersetLabelByBlockId = useMemo(() => {
      let supersetIndex = 0;

      return new Map(
        orderedRows
          .filter(block => block.supersetId)
          .map(
            block => [block.id, formatSupersetLabel(supersetIndex++)] as const
          )
      );
    }, [orderedRows]);

    useEffect(() => {
      // Only fires when exercises are added/removed, not on order changes
      // (memo blocks re-renders for order-only changes)
      setOrderedRows(blocks);
    }, [rowIds]); // eslint-disable-line react-hooks/exhaustive-deps

    const setRowsFromWorkoutExercises = useCallback(
      (
        currentFlatRows: EditableWorkoutExerciseRow[],
        nextWorkoutExerciseRows: Pick<WorkoutExercise, 'id' | 'supersetId'>[]
      ) => {
        const supersetIdByWorkoutExerciseId = new Map(
          nextWorkoutExerciseRows.map(row => [row.id, row.supersetId])
        );

        setOrderedRows(
          groupSupersetBlocks(
            currentFlatRows
              .filter(row =>
                supersetIdByWorkoutExerciseId.has(row.workoutExercise.id)
              )
              .map(row => {
                const supersetId =
                  supersetIdByWorkoutExerciseId.get(row.workoutExercise.id) ??
                  null;

                return {
                  ...row,
                  supersetId,
                  workoutExercise: {
                    ...row.workoutExercise,
                    supersetId
                  }
                };
              })
          )
        );
      },
      []
    );

    const removeRow = useCallback(
      (rowId: WorkoutExercise['id']) => {
        const nextWorkoutExerciseRows = normalizeSupersetRows(
          flatRows
            .filter(nextRow => nextRow.workoutExercise.id !== rowId)
            .map(nextRow => nextRow.workoutExercise)
        );

        onChangeRows(nextWorkoutExerciseRows);
        setRowsFromWorkoutExercises(flatRows, nextWorkoutExerciseRows);
      },
      [flatRows, onChangeRows, setRowsFromWorkoutExercises]
    );

    const unlinkSuperset = useCallback(
      (supersetId: string) => {
        const nextWorkoutExerciseRows = unlinkSupersetRows(
          flatRows.map(row => row.workoutExercise),
          supersetId
        );

        onChangeRows(nextWorkoutExerciseRows);
        setRowsFromWorkoutExercises(flatRows, nextWorkoutExerciseRows);
      },
      [flatRows, onChangeRows, setRowsFromWorkoutExercises]
    );

    const renderRow = useCallback<
      ReorderableListRenderItem<SupersetBlock<EditableWorkoutExerciseRow>>
    >(
      ({ item, index, isDragging, isReordering }) => {
        const canLinkWithNext =
          item.rows.length === 1 &&
          orderedRows[index + 1]?.rows.length === 1 &&
          !item.rows[0].workoutExercise.supersetId &&
          !orderedRows[index + 1].rows[0].workoutExercise.supersetId;
        const supersetLabel = item.supersetId
          ? supersetLabelByBlockId.get(item.id)
          : undefined;
        const content = item.supersetId ? (
          <SupersetExerciseGroup
            rows={item.rows}
            supersetLabel={supersetLabel ?? 'Superset'}
            renderHeaderActions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-0 px-0 py-0"
                  textClassName="text-muted-foreground text-small"
                  accessibilityLabel={`Unlink ${supersetLabel ?? 'superset'}`}
                  onPress={() => {
                    unlinkSuperset(item.supersetId!);
                  }}
                >
                  Unlink
                </Button>
                {shouldShowDragHandle ? (
                  <ReorderableHandle>
                    {({ onPressIn }) => (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDragging}
                        accessibilityLabel={`Drag Superset ${supersetLabel}`}
                        onPressIn={onPressIn}
                      >
                        <Icon
                          as={GripIcon}
                          size={iconSizes.sm}
                          tone="mutedForeground"
                        />
                      </Button>
                    )}
                  </ReorderableHandle>
                ) : null}
              </>
            }
            renderRow={({ row }) => {
              return (
                <ActiveWorkoutExerciseEditRow
                  key={row.workoutExercise.id}
                  item={row}
                  isDragging={false}
                  className="flex-1"
                  onOpenActions={() =>
                    setSelectedExerciseId(row.workoutExercise.id)
                  }
                  shouldShowDragHandle={false}
                />
              );
            }}
          />
        ) : (
          <View className="border-border border-b pb-2">
            {item.rows.map(row => (
              <ActiveWorkoutExerciseEditRow
                key={row.workoutExercise.id}
                item={row}
                isDragging={isDragging}
                onOpenActions={() =>
                  setSelectedExerciseId(row.workoutExercise.id)
                }
                shouldShowDragHandle={shouldShowDragHandle}
              />
            ))}
          </View>
        );

        return (
          <View className="py-2">
            {content}

            {canLinkWithNext ? (
              <PairWithNextControl
                isReordering={isReordering}
                onPress={() => {
                  const nextWorkoutExerciseRows = linkAdjacentSupersetRows(
                    flatRows.map(row => row.workoutExercise),
                    item.rows[0].workoutExercise.id
                  );

                  onChangeRows(nextWorkoutExerciseRows);
                  setRowsFromWorkoutExercises(
                    flatRows,
                    nextWorkoutExerciseRows
                  );
                }}
              />
            ) : null}
          </View>
        );
      },
      [
        onChangeRows,
        orderedRows,
        setRowsFromWorkoutExercises,
        shouldShowDragHandle,
        supersetLabelByBlockId,
        flatRows,
        unlinkSuperset
      ]
    );

    const getRowKey = useCallback(
      (item: SupersetBlock<EditableWorkoutExerciseRow>) => item.id,
      []
    );

    const selectedItem = editableRows.find(
      row => row.workoutExercise.id === selectedExerciseId
    );

    return (
      <>
        <ReorderableList
          className="flex-1 px-4"
          data={orderedRows}
          keyExtractor={getRowKey}
          onReorder={data => {
            setOrderedRows(data);
            onChangeRows(
              flattenSupersetBlocks(data).map(row => row.workoutExercise)
            );
          }}
          renderItem={renderRow}
        />
        <ActiveWorkoutExerciseActionsSheet
          isOpen={selectedItem !== undefined}
          item={selectedItem}
          isInSuperset={Boolean(selectedItem?.workoutExercise.supersetId)}
          onClose={() => setSelectedExerciseId(undefined)}
          onRemoveFromSuperset={() => {
            const supersetId = selectedItem?.workoutExercise.supersetId;

            if (supersetId) {
              unlinkSuperset(supersetId);
            }

            setSelectedExerciseId(undefined);
          }}
          onRemoveFromWorkout={() => {
            if (selectedItem) {
              removeRow(selectedItem.workoutExercise.id);
            }

            setSelectedExerciseId(undefined);
          }}
        />
      </>
    );
  }
);

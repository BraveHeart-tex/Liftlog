import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { WorkoutExercise } from '@/src/db/schema';
import { ActiveWorkoutExerciseEditRow } from '@/src/features/workouts/components/active-workout-exercise-edit-row';
import { PairWithNextControl } from '@/src/features/workouts/components/pair-with-next-control';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/workout-components.types';
import {
  flattenSupersetBlocks,
  formatSupersetLetter,
  groupSupersetBlocks,
  linkAdjacentSupersetRows,
  normalizeSupersetRows,
  unlinkSupersetRows,
  type SupersetBlock
} from '@/src/features/workouts/superset.utils';
import { iconSizes } from '@/src/theme/sizes';
import { UnlinkIcon } from 'lucide-react-native';
import type { ComponentRef } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable, {
  type DragStartParams,
  type SortableGridDragEndParams,
  type SortableGridRenderItem
} from 'react-native-sortables';

const DRAG_ACTIVATION_DELAY_MS = 0;

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
    const [orderedRows, setOrderedRows] = useState(() =>
      groupSupersetBlocks(editableRows)
    );
    const [draggingBlockKey, setDraggingBlockKey] = useState<string | null>(
      null
    );
    const blocks = useMemo(
      () => groupSupersetBlocks(editableRows),
      [editableRows]
    );
    const scrollableRef =
      useAnimatedRef<ComponentRef<typeof Animated.ScrollView>>();

    const rowIds = rows
      .map(r => `${r.workoutExercise.id}:${r.workoutExercise.supersetId ?? ''}`)
      .join(',');
    const shouldShowDragHandle = blocks.length > 1;

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

    const renderRow = useCallback<
      SortableGridRenderItem<SupersetBlock<EditableWorkoutExerciseRow>>
    >(
      ({ item, index }) => {
        const flatRows = flattenSupersetBlocks(orderedRows);
        const canLinkWithNext =
          !draggingBlockKey &&
          item.rows.length === 1 &&
          orderedRows[index + 1]?.rows.length === 1 &&
          !item.rows[0].workoutExercise.supersetId &&
          !orderedRows[index + 1].rows[0].workoutExercise.supersetId;
        const supersetLabel = item.supersetId
          ? formatSupersetLetter(
              orderedRows.slice(0, index).filter(block => block.supersetId)
                .length
            )
          : undefined;

        return (
          <View className="py-2">
            <View className="border-border border-b pb-2">
              {item.supersetId ? (
                <View className="mb-1 flex-row items-center justify-between">
                  <Text variant="caption" tone="muted">
                    Superset {supersetLabel}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-0 px-0 py-0"
                    textClassName="text-danger text-sm"
                    leftIcon={
                      <Icon as={UnlinkIcon} size={iconSizes.xs} tone="danger" />
                    }
                    onPress={() => {
                      const nextWorkoutExerciseRows = unlinkSupersetRows(
                        flatRows.map(row => row.workoutExercise),
                        item.supersetId!
                      );

                      onChangeRows(nextWorkoutExerciseRows);
                      setRowsFromWorkoutExercises(
                        flatRows,
                        nextWorkoutExerciseRows
                      );
                    }}
                  >
                    Unlink
                  </Button>
                </View>
              ) : null}

              {item.rows.map((row, rowIndex) => (
                <ActiveWorkoutExerciseEditRow
                  key={row.workoutExercise.id}
                  item={row}
                  isDragging={false}
                  label={supersetLabel}
                  onRemove={() => {
                    const nextWorkoutExerciseRows = normalizeSupersetRows(
                      flatRows
                        .filter(
                          nextRow =>
                            nextRow.workoutExercise.id !==
                            row.workoutExercise.id
                        )
                        .map(nextRow => nextRow.workoutExercise)
                    );

                    onChangeRows(nextWorkoutExerciseRows);
                    setRowsFromWorkoutExercises(
                      flatRows,
                      nextWorkoutExerciseRows
                    );
                  }}
                  shouldShowDragHandle={
                    shouldShowDragHandle && rowIndex === item.rows.length - 1
                  }
                />
              ))}
            </View>

            {canLinkWithNext ? (
              <PairWithNextControl
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
        draggingBlockKey,
        onChangeRows,
        orderedRows,
        setRowsFromWorkoutExercises,
        shouldShowDragHandle
      ]
    );

    const getRowKey = useCallback(
      (item: SupersetBlock<EditableWorkoutExerciseRow>) => item.id,
      []
    );

    const handleDragEnd = useCallback(
      ({
        data,
        fromIndex,
        toIndex
      }: SortableGridDragEndParams<
        SupersetBlock<EditableWorkoutExerciseRow>
      >) => {
        setDraggingBlockKey(null);

        if (fromIndex === toIndex) {
          return;
        }

        setOrderedRows(data);
        onChangeRows(
          flattenSupersetBlocks(data).map(row => row.workoutExercise)
        );
      },
      [onChangeRows]
    );

    const handleDragStart = useCallback(({ key }: DragStartParams) => {
      setDraggingBlockKey(key);
    }, []);

    return (
      <Animated.ScrollView className="flex-1 px-4" ref={scrollableRef}>
        <Sortable.Grid
          columns={1}
          customHandle
          data={orderedRows}
          dimensionsAnimationType="none"
          dragActivationDelay={DRAG_ACTIVATION_DELAY_MS}
          activationAnimationDuration={120}
          dropAnimationDuration={120}
          itemEntering={null}
          itemExiting={null}
          keyExtractor={getRowKey}
          renderItem={renderRow}
          scrollableRef={scrollableRef}
          strategy="insert"
          overDrag="vertical"
          activeItemScale={1.02}
          activeItemOpacity={0.96}
          inactiveItemOpacity={1}
          inactiveItemScale={1}
          hapticsEnabled={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </Animated.ScrollView>
    );
  }
);

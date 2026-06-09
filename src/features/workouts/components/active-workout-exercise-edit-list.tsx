import type { WorkoutExercise } from '@/src/db/schema';
import { memo, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import DraggableFlatList, {
  type DragEndParams,
  type RenderItemParams
} from 'react-native-draggable-flatlist';
import { ActiveWorkoutExerciseEditRow } from './active-workout-exercise-edit-row';
import type { WorkoutExerciseWithSets } from './types';

const draggableListContainerStyle = { flex: 1 };

interface ActiveWorkoutExerciseEditListProps {
  rows: WorkoutExerciseWithSets[];
  onReorderExercises: (
    orderedWorkoutExerciseIds: WorkoutExercise['id'][]
  ) => boolean;
}

export const ActiveWorkoutExerciseEditList = memo(
  function ActiveWorkoutExerciseEditList({
    rows,
    onReorderExercises
  }: ActiveWorkoutExerciseEditListProps) {
    const [orderedRows, setOrderedRows] = useState(rows);

    const rowIds = rows.map(r => r.workoutExercise.id).join(',');
    const shouldShowDragHandle = rows.length > 1;

    // TODO: Check the need for this while implementing delete exercise logic
    useEffect(() => {
      // Only fires when exercises are added/removed, not on order changes
      // (memo blocks re-renders for order-only changes)
      setOrderedRows(rows);
    }, [rowIds]); // eslint-disable-line react-hooks/exhaustive-deps

    const renderRow = useCallback(
      ({ item, drag, isActive }: RenderItemParams<WorkoutExerciseWithSets>) => (
        <ActiveWorkoutExerciseEditRow
          item={item}
          isDragging={isActive}
          onDrag={drag}
          shouldShowDragHandle={shouldShowDragHandle}
        />
      ),
      [shouldShowDragHandle]
    );

    const renderFooter = useCallback(() => <View className="h-6" />, []);

    // TODO(FE-195): This is bad, but we have to use to solve the list flickering issue
    const getRowKey = useCallback(
      (item: WorkoutExerciseWithSets, index: number) =>
        `${item.workoutExercise.id}-${index}`,
      []
    );

    const handleDragEnd = useCallback(
      ({ data, from, to }: DragEndParams<WorkoutExerciseWithSets>) => {
        if (from === to) {
          return;
        }

        const previousRows = orderedRows;

        setOrderedRows(data);

        const didReorder = onReorderExercises(
          data.map(item => item.workoutExercise.id)
        );

        if (!didReorder) {
          setOrderedRows(previousRows);
        }
      },
      [onReorderExercises, orderedRows]
    );

    return (
      <View className="flex-1 px-4">
        <DraggableFlatList
          data={orderedRows}
          keyExtractor={getRowKey}
          containerStyle={draggableListContainerStyle}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderFooter}
          renderItem={renderRow}
          onDragEnd={handleDragEnd}
        />
      </View>
    );
  }
);

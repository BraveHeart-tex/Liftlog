import type { WorkoutExercise } from '@/src/db/schema';
import { ActiveWorkoutExerciseEditRow } from '@/src/features/workouts/components/active-workout-exercise-edit-row';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/workout-components.types';
import type { ComponentRef } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable, {
  type SortableGridDragEndParams,
  type SortableGridRenderItem
} from 'react-native-sortables';

const DRAG_ACTIVATION_DELAY_MS = 0;

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
    const scrollableRef =
      useAnimatedRef<ComponentRef<typeof Animated.ScrollView>>();

    const rowIds = rows.map(r => r.workoutExercise.id).join(',');
    const shouldShowDragHandle = rows.length > 1;

    useEffect(() => {
      // Only fires when exercises are added/removed, not on order changes
      // (memo blocks re-renders for order-only changes)
      setOrderedRows(rows);
    }, [rowIds]); // eslint-disable-line react-hooks/exhaustive-deps

    const renderRow = useCallback<
      SortableGridRenderItem<WorkoutExerciseWithSets>
    >(
      ({ item }) => (
        <ActiveWorkoutExerciseEditRow
          item={item}
          isDragging={false}
          shouldShowDragHandle={shouldShowDragHandle}
        />
      ),
      [shouldShowDragHandle]
    );

    const getRowKey = useCallback(
      (item: WorkoutExerciseWithSets) => String(item.workoutExercise.id),
      []
    );

    const handleDragEnd = useCallback(
      ({
        data,
        fromIndex,
        toIndex
      }: SortableGridDragEndParams<WorkoutExerciseWithSets>) => {
        if (fromIndex === toIndex) {
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
          onDragEnd={handleDragEnd}
        />
      </Animated.ScrollView>
    );
  }
);

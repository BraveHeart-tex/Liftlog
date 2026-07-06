import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { NewTemplateExerciseRow } from '@/src/features/workouts/components/new-template-exercise-row';
import type { ComponentRef } from 'react';
import { useCallback } from 'react';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable, {
  type SortableGridDragEndParams,
  type SortableGridRenderItem
} from 'react-native-sortables';

const DRAG_ACTIVATION_DELAY_MS = 0;

interface NewTemplateExerciseListProps {
  exercises: ExerciseListItem[];
  onDeleteExercise: (exerciseId: ExerciseListItem['id']) => void;
  onReorderExercises: (exercises: ExerciseListItem[]) => void;
}

export function NewTemplateExerciseList({
  exercises,
  onDeleteExercise,
  onReorderExercises
}: NewTemplateExerciseListProps) {
  const shouldShowDragHandle = exercises.length > 1;
  const scrollableRef =
    useAnimatedRef<ComponentRef<typeof Animated.ScrollView>>();

  const renderExercise = useCallback<SortableGridRenderItem<ExerciseListItem>>(
    ({ item }) => (
      <NewTemplateExerciseRow
        exercise={item}
        isDragging={false}
        onDelete={() => onDeleteExercise(item.id)}
        shouldShowDragHandle={shouldShowDragHandle}
      />
    ),
    [onDeleteExercise, shouldShowDragHandle]
  );

  const handleDragEnd = useCallback(
    ({
      data,
      fromIndex,
      toIndex
    }: SortableGridDragEndParams<ExerciseListItem>) => {
      if (fromIndex !== toIndex) {
        onReorderExercises(data);
      }
    },
    [onReorderExercises]
  );

  const keyExtractor = useCallback(
    (exercise: ExerciseListItem) => String(exercise.id),
    []
  );

  return (
    <Animated.ScrollView className="mt-2 flex-1 px-4" ref={scrollableRef}>
      <Sortable.Grid
        columns={1}
        customHandle
        data={exercises}
        dimensionsAnimationType="none"
        dragActivationDelay={DRAG_ACTIVATION_DELAY_MS}
        activationAnimationDuration={120}
        dropAnimationDuration={120}
        itemEntering={null}
        itemExiting={null}
        keyExtractor={keyExtractor}
        renderItem={renderExercise}
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

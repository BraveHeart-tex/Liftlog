import type { Exercise } from '@/src/db';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { NewTemplateExerciseRow } from '@/src/features/workouts/components/new-template-exercise-row';
import { useCallback } from 'react';
import DraggableFlatList, {
  type DragEndParams,
  type RenderItemParams
} from 'react-native-draggable-flatlist';

const listContainerStyle = { flex: 1 };
const contentContainerStyle = { paddingBottom: 24 };

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

  const renderExercise = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ExerciseListItem>) => (
      <NewTemplateExerciseRow
        exercise={item}
        isDragging={isActive}
        onDelete={() => onDeleteExercise(item.id)}
        onDrag={drag}
        shouldShowDragHandle={shouldShowDragHandle}
      />
    ),
    [onDeleteExercise, shouldShowDragHandle]
  );

  const handleDragEnd = useCallback(
    ({ data, from, to }: DragEndParams<ExerciseListItem>) => {
      if (from !== to) {
        onReorderExercises(data);
      }
    },
    [onReorderExercises]
  );

  const keyExtractor = useCallback((exercise: Exercise) => exercise.id, []);

  return (
    <DraggableFlatList
      data={exercises}
      keyExtractor={keyExtractor}
      containerStyle={listContainerStyle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      renderItem={renderExercise}
      onDragEnd={handleDragEnd}
    />
  );
}

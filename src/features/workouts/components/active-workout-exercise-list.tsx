import { StyledScrollView } from '@/src/components/styled/scroll-view';
import type { WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { useActiveWorkoutExerciseList } from '@/src/features/workouts/hooks';
import { ActiveWorkoutExerciseCard } from '@/src/features/workouts/components/active-workout-exercise-card';
import { ActiveWorkoutExerciseEditList } from '@/src/features/workouts/components/active-workout-exercise-edit-list';

interface ActiveWorkoutExerciseListProps {
  workoutExercises: WorkoutExercise[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
  mode?: 'active' | 'historical';
  onEnterEditMode: () => void;
  onReorderExercises: (
    orderedWorkoutExerciseIds: WorkoutExercise['id'][]
  ) => boolean;
  isEditing: boolean;
}

export function ActiveWorkoutExerciseList({
  workoutExercises,
  exerciseById,
  mode = 'active',
  onEnterEditMode,
  onReorderExercises,
  isEditing
}: ActiveWorkoutExerciseListProps) {
  const workoutExercisesWithSets = useActiveWorkoutExerciseList({
    workoutExercises,
    exerciseById
  });

  if (isEditing) {
    return (
      <ActiveWorkoutExerciseEditList
        rows={workoutExercisesWithSets}
        onReorderExercises={onReorderExercises}
      />
    );
  }

  return (
    <StyledScrollView
      className="flex-1"
      contentContainerClassName="flex-grow px-4 pb-6"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {workoutExercisesWithSets.map(workoutExercise => (
        <ActiveWorkoutExerciseCard
          key={workoutExercise.workoutExercise.id}
          item={workoutExercise}
          mode={mode}
          className="mt-4"
          onLongPress={onEnterEditMode}
        />
      ))}
    </StyledScrollView>
  );
}

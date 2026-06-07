import type { WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { useActiveWorkoutExerciseList } from '@/src/features/workouts/hooks';
import { ActiveWorkoutExerciseCard } from './active-workout-exercise-card';
import { ActiveWorkoutExerciseEditRow } from './active-workout-exercise-edit-row';

interface ActiveWorkoutExerciseListProps {
  workoutExercises: WorkoutExercise[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
  onEnterEditMode: () => void;
  isEditing: boolean;
}

export function ActiveWorkoutExerciseList({
  workoutExercises,
  exerciseById,
  onEnterEditMode,
  isEditing
}: ActiveWorkoutExerciseListProps) {
  const workoutExercisesWithSets = useActiveWorkoutExerciseList({
    workoutExercises,
    exerciseById
  });

  return workoutExercisesWithSets.map(workoutExercise =>
    isEditing ? (
      <ActiveWorkoutExerciseEditRow
        key={workoutExercise.workoutExercise.id}
        item={workoutExercise}
      />
    ) : (
      <ActiveWorkoutExerciseCard
        key={workoutExercise.workoutExercise.id}
        item={workoutExercise}
        className="mt-4"
        onLongPress={onEnterEditMode}
      />
    )
  );
}

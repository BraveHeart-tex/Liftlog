import type { WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { useActiveWorkoutExerciseList } from '@/src/features/workouts/hooks';
import { ActiveWorkoutExerciseCard } from './active-workout-exercise-card';

interface ActiveWorkoutExerciseListProps {
  workoutExercises: WorkoutExercise[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
}

export function ActiveWorkoutExerciseList({
  workoutExercises,
  exerciseById
}: ActiveWorkoutExerciseListProps) {
  const workoutExercisesWithSets = useActiveWorkoutExerciseList({
    workoutExercises,
    exerciseById
  });

  return workoutExercisesWithSets.map(workoutExercise => (
    <ActiveWorkoutExerciseCard
      key={workoutExercise.workoutExercise.id}
      item={workoutExercise}
      className="mt-4"
    />
  ));
}

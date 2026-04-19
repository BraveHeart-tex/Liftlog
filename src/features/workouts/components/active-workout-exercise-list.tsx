import type { Exercise, WorkoutExercise } from '@/src/db/schema';
import { useActiveWorkoutExerciseList } from '@/src/features/workouts/hooks';
import { ExerciseCard } from './exercise-card';

interface ActiveWorkoutExerciseListProps {
  workoutExercises: WorkoutExercise[];
  exerciseById: Map<Exercise['id'], Exercise>;
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
    <ExerciseCard
      key={workoutExercise.workoutExercise.id}
      item={workoutExercise}
      className="mt-4"
    />
  ));
}

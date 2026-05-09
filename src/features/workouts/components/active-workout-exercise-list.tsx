import type { WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { useActiveWorkoutExerciseList } from '@/src/features/workouts/hooks';
import { ExerciseCard } from './exercise-card';
import { View } from 'react-native';
import { Text } from '@/src/components/ui/text';

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

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text variant="caption" tone="muted" className="tracking-widest">
          EXERCISES
        </Text>
        {workoutExercisesWithSets.length > 0 && (
          <Text variant="caption" tone="muted">
            {workoutExercisesWithSets.length} total
          </Text>
        )}
      </View>
      {workoutExercisesWithSets.map(workoutExercise => (
        <ExerciseCard
          key={workoutExercise.workoutExercise.id}
          item={workoutExercise}
          className="mt-4"
        />
      ))}
    </View>
  );
}

import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { useExerciseHistory } from '@/src/features/workouts/hooks/use-exercise-history';
import { useActiveWorkoutExerciseDetail } from '@/src/features/workouts/hooks/use-active-workout-exercise-detail';

export function useWorkoutExerciseHistoryScreen(
  workoutExerciseId: string | undefined
) {
  const { weightUnit } = useSettings();
  const { item, isLoading } = useActiveWorkoutExerciseDetail(workoutExerciseId);
  const exercise = item?.exercise ?? null;
  const exerciseId = item?.workoutExercise.exerciseId ?? '';
  const historyState = useExerciseHistory(exerciseId);

  return {
    exercise,
    exerciseId: exercise?.id ?? null,
    weightUnit,
    isLoading,
    ...historyState
  };
}

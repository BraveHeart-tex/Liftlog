import { useSettings } from '@/src/features/settings/hooks';
import { useExerciseHistory } from './use-exercise-history';
import { useActiveWorkoutExerciseDetail } from './use-active-workout-exercise-detail';

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

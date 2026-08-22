import { WorkoutExerciseHistoryScreen } from '@/src/features/workouts/active/screens/workout-exercise-history-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function WorkoutExerciseHistoryRoute() {
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();

  return (
    <WorkoutExerciseHistoryScreen workoutExerciseId={getRouteParamId(rawId)} />
  );
}

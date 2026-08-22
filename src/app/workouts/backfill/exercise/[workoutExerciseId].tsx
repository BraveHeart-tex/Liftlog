import { HistoricalWorkoutExerciseScreen } from '@/src/features/workouts/history/screens/historical-workout-exercise-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function HistoricalWorkoutExerciseRoute() {
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();

  return (
    <HistoricalWorkoutExerciseScreen
      workoutExerciseId={getRouteParamId(rawId)}
    />
  );
}

import { HistoricalWorkoutEditExerciseScreen } from '@/src/features/workouts/history/screens/historical-workout-edit-exercise-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function HistoricalWorkoutEditExerciseRoute() {
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();

  return (
    <HistoricalWorkoutEditExerciseScreen
      workoutExerciseId={getRouteParamId(rawId)}
    />
  );
}

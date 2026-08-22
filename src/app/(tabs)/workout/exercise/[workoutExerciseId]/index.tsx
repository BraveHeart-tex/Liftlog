import { ActiveWorkoutExerciseScreen } from '@/src/features/workouts/active/screens/active-workout-exercise-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function ActiveWorkoutExerciseRoute() {
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();

  return (
    <ActiveWorkoutExerciseScreen workoutExerciseId={getRouteParamId(rawId)} />
  );
}

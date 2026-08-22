import { WorkoutDetailScreen } from '@/src/features/workouts/history/screens/workout-detail-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function WorkoutDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <WorkoutDetailScreen workoutId={getRouteParamId(id)} />;
}

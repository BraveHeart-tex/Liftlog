import { ExerciseDetailScreen } from '@/src/features/exercises/screens/exercise-detail-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function ExerciseDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <ExerciseDetailScreen exerciseId={getRouteParamId(id)} />;
}

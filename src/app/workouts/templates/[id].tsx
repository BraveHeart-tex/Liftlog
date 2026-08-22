import { WorkoutTemplateDetailScreen } from '@/src/features/workouts/templates/screens/workout-template-detail-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function WorkoutTemplateDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <WorkoutTemplateDetailScreen templateId={getRouteParamId(id)} />;
}

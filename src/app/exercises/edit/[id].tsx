import { EditExerciseScreen } from '@/src/features/exercises/screens/edit-exercise-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function EditExerciseRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <EditExerciseScreen exerciseId={getRouteParamId(id)} />;
}

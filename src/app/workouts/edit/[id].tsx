import { HistoricalWorkoutEditScreen } from '@/src/features/workouts/history/screens/historical-workout-edit-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function HistoricalWorkoutEditRoute() {
  const { id, sourceWorkoutId: rawSourceWorkoutId } = useLocalSearchParams<{
    id?: string | string[];
    sourceWorkoutId?: string | string[];
  }>();

  return (
    <HistoricalWorkoutEditScreen
      draftWorkoutId={getRouteParamId(id)}
      sourceWorkoutId={getRouteParamId(rawSourceWorkoutId)}
    />
  );
}

import { HistoricalWorkoutDraftScreen } from '@/src/features/workouts/history/screens/historical-workout-draft-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';

export default function HistoricalWorkoutDraftRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <HistoricalWorkoutDraftScreen workoutId={getRouteParamId(id)} />;
}

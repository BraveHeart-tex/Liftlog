import { BackButton } from '@/src/components/ui/back-button';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseHistoryList } from '@/src/features/workouts/components/exercise-history-list';
import { useWorkoutExerciseHistoryScreen } from '@/src/features/workouts/hooks/use-workout-exercise-history-screen';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function WorkoutExerciseHistoryScreen() {
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();
  const workoutExerciseId = getRouteParamId(rawId);
  const {
    exercise,
    history,
    isLoading,
    latestPersonalRecord,
    monthlyProgression,
    prSetIds,
    trackingType,
    weightUnit
  } = useWorkoutExerciseHistoryScreen(workoutExerciseId);

  if (workoutExerciseId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading history..." />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Exercise not found
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          This exercise may have been deleted.
        </Text>
        <BackButton variant="text" className="mt-4" />
      </Screen>
    );
  }

  return (
    <Screen withPadding={false} edges={[]}>
      <View className="flex-1">
        <View className="px-4 pt-6 pb-2">
          <Text variant="h2">{exercise.name}</Text>
        </View>

        <ExerciseHistoryList
          history={history}
          latestPersonalRecord={latestPersonalRecord}
          monthlyProgression={monthlyProgression}
          prSetIds={prSetIds}
          trackingType={trackingType}
          weightUnit={weightUnit}
        />
      </View>
    </Screen>
  );
}

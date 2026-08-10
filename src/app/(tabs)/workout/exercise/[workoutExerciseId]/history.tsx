import { BackButton } from '@/src/components/ui/back-button';
import { EmptyState } from '@/src/components/ui/empty-state';
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
    hasMoreHistory,
    isLoading,
    isLoadingMore,
    latestPersonalRecord,
    loadMore,
    loadMoreError,
    monthlyProgression,
    prSetIds,
    retryLoadMore,
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
      <Screen withPadding={false} contentClassName="px-6">
        <EmptyState
          kind="not-found"
          title="Exercise not found"
          description="This exercise may have been deleted."
          actions={<BackButton variant="text" />}
        />
      </Screen>
    );
  }

  return (
    <Screen withPadding={false} edges={[]}>
      <View className="flex-1">
        <View className="px-4 pt-4">
          <Text variant="h2">{exercise.name}</Text>
        </View>

        <ExerciseHistoryList
          history={history}
          hasMoreHistory={hasMoreHistory}
          isLoadingMore={isLoadingMore}
          latestPersonalRecord={latestPersonalRecord}
          loadMore={loadMore}
          loadMoreError={loadMoreError}
          monthlyProgression={monthlyProgression}
          prSetIds={prSetIds}
          retryLoadMore={retryLoadMore}
          trackingType={trackingType}
          weightUnit={weightUnit}
        />
      </View>
    </Screen>
  );
}

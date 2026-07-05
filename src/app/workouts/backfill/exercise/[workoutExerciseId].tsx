import { BackButton } from '@/src/components/ui/back-button';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseTrackSection } from '@/src/features/workouts/components/exercise-track-section';
import { useActiveWorkoutExerciseDetail } from '@/src/features/workouts/hooks/use-active-workout-exercise-detail';
import { HISTORICAL_WORKOUT_DRAFT_STATUS } from '@/src/features/workouts/workout.repository';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

export default function HistoricalWorkoutExerciseScreen() {
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();
  const workoutExerciseId = getRouteParamId(rawId);
  const { item, workout, isLoading } =
    useActiveWorkoutExerciseDetail(workoutExerciseId);

  const keyboardAvoidingBehavior =
    Platform.OS === 'ios' ? ('padding' as const) : ('height' as const);

  if (workoutExerciseId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading exercise..." />
      </Screen>
    );
  }

  if (!item || workout?.status !== HISTORICAL_WORKOUT_DRAFT_STATUS) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Exercise not found
        </Text>
        <BackButton variant="text" className="mt-4" />
      </Screen>
    );
  }

  return (
    <Screen withPadding={false}>
      <View className="flex-1 px-4">
        <View className="pt-4 pb-3">
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text variant="h2" className="flex-1 text-center" numberOfLines={1}>
              {item.exercise?.name ?? 'Unknown exercise'}
            </Text>
            <View className="h-11 w-11" />
          </View>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={keyboardAvoidingBehavior}
          className="w-full flex-1"
        >
          <ExerciseTrackSection
            item={item}
            mode="historical"
            historyBeforeStartedAt={workout.startedAt}
          />
        </KeyboardAvoidingView>
      </View>
    </Screen>
  );
}

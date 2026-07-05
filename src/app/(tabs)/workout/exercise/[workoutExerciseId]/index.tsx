import { BackButton } from '@/src/components/ui/back-button';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseTrackSection } from '@/src/features/workouts/components/exercise-track-section';
import { RestTimerSheet } from '@/src/features/workouts/components/rest-timer-sheet';
import { RestTimerTrigger } from '@/src/features/workouts/components/rest-timer-trigger';
import { useActiveWorkoutExerciseDetail } from '@/src/features/workouts/hooks/use-active-workout-exercise-detail';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

export default function ActiveWorkoutExerciseScreen() {
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();
  const workoutExerciseId = getRouteParamId(rawId);

  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const openRestTimer = useCallback(() => setIsRestTimerOpen(true), []);
  const closeRestTimer = useCallback(() => setIsRestTimerOpen(false), []);

  const { item, isLoading } = useActiveWorkoutExerciseDetail(workoutExerciseId);

  const keyboardAvoidingBehavior =
    Platform.OS === 'ios' ? ('padding' as const) : ('height' as const);

  if (workoutExerciseId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading exercise..." />
      </Screen>
    );
  }

  if (!item) {
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
            <RestTimerTrigger onPress={openRestTimer} />
          </View>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={keyboardAvoidingBehavior}
          className="w-full flex-1"
        >
          <ExerciseTrackSection item={item} />
        </KeyboardAvoidingView>
      </View>
      <RestTimerSheet isOpen={isRestTimerOpen} onClose={closeRestTimer} />
    </Screen>
  );
}

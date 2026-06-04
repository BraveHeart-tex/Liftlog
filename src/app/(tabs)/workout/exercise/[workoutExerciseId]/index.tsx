import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseTrackSection } from '@/src/features/workouts/components/exercise-track-section';
import { RestTimerSheet } from '@/src/features/workouts/components/rest-timer-sheet';
import { useActiveWorkoutExerciseDetail } from '@/src/features/workouts/hooks';
import { useIsRestTimerRunning } from '@/src/features/workouts/hooks/use-is-rest-timer-running';
import { getRouteParamId } from '@/src/lib/utils/route';
import { useLocalSearchParams } from 'expo-router';
import { TimerIcon } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

export default function ActiveWorkoutExerciseScreen() {
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();
  const workoutExerciseId = getRouteParamId(rawId);

  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);

  const { item, isLoading } = useActiveWorkoutExerciseDetail(workoutExerciseId);

  const isRestTimerRunning = useIsRestTimerRunning();
  const keyboardAvoidingBehavior =
    Platform.OS === 'ios' ? ('padding' as const) : undefined;

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
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setIsRestTimerOpen(true)}
            >
              <Icon icon={TimerIcon} size="lg" className="text-foreground" />
              {isRestTimerRunning ? (
                <View className="bg-primary absolute top-0 right-0 h-2 w-2 rounded-full" />
              ) : null}
            </Button>
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
      <RestTimerSheet
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
      />
    </Screen>
  );
}

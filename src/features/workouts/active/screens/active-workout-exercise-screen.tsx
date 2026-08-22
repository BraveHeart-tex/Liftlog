import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseTrackSection } from '@/src/features/workouts/set-entry/components/exercise-track-section';
import { RestTimerSheet } from '@/src/features/rest-timer/components/rest-timer-sheet';
import { RestTimerTrigger } from '@/src/features/rest-timer/components/rest-timer-trigger';
import { useActiveWorkoutExerciseDetail } from '@/src/features/workouts/active/hooks/use-active-workout-exercise-detail';
import { router } from 'expo-router';
import { ArrowRightIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

export function ActiveWorkoutExerciseScreen({
  workoutExerciseId
}: {
  workoutExerciseId?: string;
}) {
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const openRestTimer = useCallback(() => setIsRestTimerOpen(true), []);
  const closeRestTimer = useCallback(() => setIsRestTimerOpen(false), []);

  const { item, pairedWorkoutExercise, pairedExercise, isLoading } =
    useActiveWorkoutExerciseDetail(workoutExerciseId);

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
    <Screen
      withPadding={false}
      edges={[]}
      footer={
        pairedWorkoutExercise ? (
          <Button
            fullWidth
            rightIcon={<Icon as={ArrowRightIcon} tone="primaryForeground" />}
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/workout/exercise/[workoutExerciseId]',
                params: { workoutExerciseId: pairedWorkoutExercise.id }
              })
            }
          >
            {`Switch to ${pairedExercise?.name ?? 'paired exercise'}`}
          </Button>
        ) : undefined
      }
    >
      <View className="min-h-0 flex-1 px-4">
        <View className="pt-6 pb-4">
          <View className="flex-row items-center gap-2">
            <Text variant="h2" className="min-w-0 flex-1" numberOfLines={1}>
              {item.exercise?.name ?? 'Unknown exercise'}
            </Text>
            <RestTimerTrigger onPress={openRestTimer} />
          </View>
        </View>
        <ExerciseTrackSection item={item} />
      </View>
      {isRestTimerOpen ? (
        <RestTimerSheet
          isOpen
          context={{
            workoutId: item.workoutExercise.workoutId,
            workoutExerciseId: item.workoutExercise.id,
            exerciseName: item.exercise?.name
          }}
          onClose={closeRestTimer}
        />
      ) : null}
    </Screen>
  );
}

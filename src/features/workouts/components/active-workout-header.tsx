import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db';
import { useFinishWorkout } from '@/src/features/workouts/hooks/use-finish-workout';
import { EllipsisVerticalIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Alert, View } from 'react-native';

interface ActiveWorkoutHeaderProps {
  workoutName: string;
  workoutId: Workout['id'];
  duration: ReactNode;
  canFinish: boolean;
  onOpenActions: () => void;
}

export function ActiveWorkoutHeader({
  workoutName,
  workoutId,
  duration,
  canFinish,
  onOpenActions
}: ActiveWorkoutHeaderProps) {
  const finishWorkout = useFinishWorkout();

  const confirmFinishWorkout = () => {
    Alert.alert(
      'Finish workout?',
      `"${workoutName}" will be saved to your workout history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            finishWorkout(workoutId);
          }
        }
      ]
    );
  };

  return (
    <View className="flex-row items-center justify-between gap-2 px-4 pt-4 pb-2">
      <BackButton />

      <View className="flex-1">
        <Text variant="h2" numberOfLines={1}>
          {workoutName}
        </Text>
        {duration}
      </View>

      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel="Workout actions"
        onPress={onOpenActions}
      >
        <Icon icon={EllipsisVerticalIcon} size="lg" tone="foreground" />
      </Button>

      <Button
        variant="primary"
        size="sm"
        disabled={!canFinish}
        onPress={confirmFinishWorkout}
      >
        Finish
      </Button>
    </View>
  );
}

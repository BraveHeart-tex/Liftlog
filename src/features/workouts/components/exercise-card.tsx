import { useDrizzle } from '@/src/components/database-provider';
import { Card, CardContent, CardHeader } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { deleteWorkoutExercise } from '@/src/features/workouts/repository';
import { router } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import type { WorkoutExerciseWithSets } from './types';
import { formatInputNumber } from './utils';

type ExerciseCardProps = {
  item: WorkoutExerciseWithSets;
  className?: string;
};

export function ExerciseCard({ item, className }: ExerciseCardProps) {
  const db = useDrizzle();
  const completedSets = item.sets.filter(set => set.status === 'completed');
  const hasCompletedSets = completedSets.length > 0;

  const handleRemoveExercise = () => {
    if (hasCompletedSets) {
      return;
    }

    Alert.alert(
      'Remove exercise?',
      'This will delete all sets for this exercise.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteWorkoutExercise(db, item.workoutExercise.id)
        }
      ]
    );
  };

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(tabs)/workout/exercise/[workoutExerciseId]',
          params: { workoutExerciseId: item.workoutExercise.id }
        })
      }
      onLongPress={handleRemoveExercise}
      className={className}
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <Text variant="bodyMedium" className="flex-1">
            {item.exercise?.name ?? 'Unknown exercise'}
          </Text>
        </CardHeader>

        <CardContent>
          {completedSets.length > 0 ? (
            <View>
              {completedSets.map((set, index) => (
                <View key={set.id} className="flex-row items-center gap-3">
                  <Text variant="caption" tone="muted" className="w-6">
                    {index + 1}
                  </Text>
                  <Text variant="caption">
                    {formatInputNumber(set.weightKg)} kg
                  </Text>
                  <Text variant="caption" tone="muted">
                    x
                  </Text>
                  <Text variant="caption">{set.reps}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text variant="small" tone="muted">
              Tap to log sets
            </Text>
          )}
        </CardContent>
      </Card>
    </Pressable>
  );
}

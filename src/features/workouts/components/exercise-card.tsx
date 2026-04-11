import { useDrizzle } from '@/src/components/database-provider';
import { Card, CardContent, CardHeader } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { deleteWorkoutExercise } from '@/src/features/workouts/repository';
import { cn } from '@/src/lib/utils/cn';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import type { WorkoutExerciseWithSets } from './types';
import { formatInputNumber } from './utils';

type ExerciseCardProps = {
  item: WorkoutExerciseWithSets;
  className?: string;
};

export function ExerciseCard({ item, className }: ExerciseCardProps) {
  const db = useDrizzle();
  const [isSelected, setIsSelected] = useState(false);
  const completedSets = item.sets.filter(set => set.status === 'completed');

  const handleRemoveExercise = () => {
    const exerciseName = item.exercise?.name ?? 'Unknown exercise';
    const setCount = item.sets.length;
    const completedSetCount = completedSets.length;
    const selectedDetails =
      setCount > 0
        ? `${exerciseName}\n${setCount} sets logged, ${completedSetCount} completed.`
        : `${exerciseName}\nNo sets logged yet.`;

    setIsSelected(true);

    Alert.alert(
      'Remove exercise?',
      `${selectedDetails}\n\nThis will delete all sets for this exercise.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsSelected(false)
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setIsSelected(false);
            deleteWorkoutExercise(db, item.workoutExercise.id);
          }
        }
      ],
      {
        onDismiss: () => setIsSelected(false)
      }
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
      <Card className={cn(isSelected && 'border-primary bg-muted/50')}>
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

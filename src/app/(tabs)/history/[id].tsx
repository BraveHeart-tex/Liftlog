import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import {
  useRepeatWorkout,
  useWorkoutHistoryDetail
} from '@/src/features/workouts/hooks';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { getRouteParamId } from '@/src/lib/utils/route';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function WorkoutHistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getRouteParamId(id);
  const {
    workout,
    activeWorkout,
    workoutExerciseRows,
    exerciseById,
    setsByWorkoutExerciseId,
    totalVolume,
    totalCompletedSets,
    weightUnit,
    isLoading,
    canRepeatWorkout
  } = useWorkoutHistoryDetail(workoutId);
  const repeatWorkout = useRepeatWorkout({
    workout,
    activeWorkout,
    workoutExerciseRows,
    canRepeatWorkout
  });

  if (workoutId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading workout..." />
      </Screen>
    );
  }

  if (!workout) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Workout not found
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          This workout may have been deleted.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="flex-row items-center gap-3">
        <BackButton />
        <View className="flex-1">
          <Text variant="h1" numberOfLines={2}>
            {workout.name}
          </Text>
          <Text variant="small" tone="muted" className="mt-1">
            {formatWorkoutDate(workout.startedAt, 'full')}
          </Text>
        </View>
      </View>

      <View className="mt-6 flex-row gap-3">
        <Card className="flex-1">
          <CardContent>
            <Text variant="caption" tone="muted">
              Duration
            </Text>
            <Text variant="h3" className="mt-1">
              {formatDuration({
                startedAt: workout.startedAt,
                completedAt: workout.completedAt
              })}
            </Text>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent>
            <Text variant="caption" tone="muted">
              Sets
            </Text>
            <Text variant="h3" className="mt-1">
              {totalCompletedSets}
            </Text>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent>
            <Text variant="caption" tone="muted">
              Volume
            </Text>
            <Text variant="h3" className="mt-1">
              {formatWeightForUnit(totalVolume, weightUnit)} {weightUnit}
            </Text>
          </CardContent>
        </Card>
      </View>

      <View className="mt-6">
        <Text variant="caption" tone="muted" className="mb-3">
          Exercises
        </Text>

        {workoutExerciseRows.length === 0 ? (
          <View className="mt-3 items-center py-8">
            <Text variant="small" tone="muted" className="text-center">
              No exercises were logged in this workout.
            </Text>
          </View>
        ) : (
          workoutExerciseRows.map(workoutExercise => {
            const exercise = exerciseById.get(workoutExercise.exerciseId);
            const completedSets =
              setsByWorkoutExerciseId.get(workoutExercise.id) ?? [];

            return (
              <Card key={workoutExercise.id} className="mt-3">
                <CardContent>
                  <Text variant="bodyMedium">
                    {exercise?.name ?? 'Unknown exercise'}
                  </Text>

                  {completedSets.length === 0 ? (
                    <Text variant="small" tone="muted" className="mt-2">
                      No sets logged
                    </Text>
                  ) : (
                    <View className="mt-3">
                      {completedSets.map((set, index) => (
                        <View
                          key={set.id}
                          className="flex-row items-center gap-3 py-1"
                        >
                          <Text variant="caption" tone="muted" className="w-6">
                            {index + 1}
                          </Text>
                          <Text variant="caption">
                            {formatWeightForUnit(set.weightKg, weightUnit)}{' '}
                            {weightUnit}
                          </Text>
                          <Text variant="caption" tone="muted">
                            x
                          </Text>
                          <Text variant="caption">{set.reps} reps</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </View>

      <Button
        variant="secondary"
        className="mt-6 w-full"
        disabled={!canRepeatWorkout}
        onPress={repeatWorkout}
      >
        {activeWorkout ? 'Resume active workout' : 'Repeat this workout'}
      </Button>
    </Screen>
  );
}

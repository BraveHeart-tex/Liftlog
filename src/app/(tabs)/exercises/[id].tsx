import { useDrizzle } from '@/src/components/database-provider';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { EditExerciseNameSheet } from '@/src/features/exercises/components/edit-exercise-name-sheet';
import { useExerciseDetail } from '@/src/features/exercises/hooks';
import { removeCustomExercise } from '@/src/features/exercises/repository';
import { cn } from '@/src/lib/utils/cn';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { formatMuscleList } from '@/src/lib/utils/muscle';
import { getRouteParamId } from '@/src/lib/utils/route';
import { toTitleCase } from '@/src/lib/utils/string';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

export default function ExerciseDetailScreen() {
  const db = useDrizzle();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const exerciseId = getRouteParamId(id);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const {
    exercise,
    exercises,
    exerciseUsageCount,
    history,
    prRows,
    primaryMuscles,
    secondaryMuscles,
    instructions,
    mostRecentHistory,
    completedSetSummary,
    weightUnit,
    isLoading
  } = useExerciseDetail(exerciseId);

  if (exerciseId && isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading exercise..." />
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
          The exercise you&apos;re looking for doesn&apos;t exist.
        </Text>
      </Screen>
    );
  }

  const isCustomExercise = exercise.isCustom === 1;
  const usageLabel =
    exerciseUsageCount === 1
      ? '1 workout entry'
      : `${exerciseUsageCount} workout entries`;
  const removeActionLabel = exerciseUsageCount > 0 ? 'Archive' : 'Delete';

  const handleRemoveCustomExercise = () => {
    if (!isCustomExercise) {
      return;
    }

    const title =
      exerciseUsageCount > 0 ? 'Archive exercise?' : 'Delete exercise?';
    const message =
      exerciseUsageCount > 0
        ? `${exercise.name} is used in ${usageLabel}. It will be hidden from new workouts, but your history stays intact.`
        : `${exercise.name} has no workout history and will be permanently deleted.`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: removeActionLabel,
        style: 'destructive',
        onPress: () => {
          let result: ReturnType<typeof removeCustomExercise>;

          try {
            result = removeCustomExercise(db, exercise.id);
          } catch (error) {
            console.error('Failed to remove custom exercise', error);
            Alert.alert(
              'Exercise was not changed',
              'Could not update this exercise. Try again.'
            );

            return;
          }

          if (result === 'archived' || result === 'deleted') {
            router.replace('/(tabs)/exercises');

            return;
          }

          Alert.alert(
            'Exercise was not changed',
            'Only custom exercises can be archived or deleted.'
          );
        }
      }
    ]);
  };

  return (
    <>
      <Screen scroll>
        <View>
          <View className="flex-row items-center gap-3">
            <BackButton />
            <View className="flex-1">
              <Text variant="h1" numberOfLines={2} ellipsizeMode="tail">
                {exercise.name}
              </Text>
              <Text variant="small" tone="muted">
                {toTitleCase(exercise.category)}
              </Text>
            </View>
          </View>
        </View>

        {isCustomExercise ? (
          <Card className="mt-6">
            <CardContent>
              <Text variant="caption" tone="muted">
                Custom exercise
              </Text>

              <Text variant="small" tone="muted" className="mt-3">
                {exerciseUsageCount > 0
                  ? `Used in ${usageLabel}. Archive keeps workout history safe.`
                  : 'Not used in any workouts yet. You can delete it permanently.'}
              </Text>

              <View className="mt-4 flex-row gap-3">
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    onPress={() => setIsEditNameOpen(true)}
                  >
                    Rename
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    variant="destructive"
                    onPress={handleRemoveCustomExercise}
                  >
                    {removeActionLabel}
                  </Button>
                </View>
              </View>
            </CardContent>
          </Card>
        ) : null}

        <Card className={isCustomExercise ? 'mt-4' : 'mt-6'}>
          <CardContent>
            <Text variant="caption" tone="muted">
              Muscle groups
            </Text>

            <View className="mt-4">
              <Text variant="small" tone="muted">
                Primary
              </Text>
              <Text variant="body" className="mt-1">
                {formatMuscleList(primaryMuscles)}
              </Text>
            </View>

            {secondaryMuscles.length > 0 ? (
              <View className="mt-4">
                <Text variant="small" tone="muted">
                  Secondary
                </Text>
                <Text variant="body" className="mt-1">
                  {formatMuscleList(secondaryMuscles)}
                </Text>
              </View>
            ) : null}
          </CardContent>
        </Card>

        {instructions ? (
          <Card className="mt-4">
            <CardContent>
              <Text variant="caption" tone="muted">
                Instructions
              </Text>
              <Text variant="body" className="mt-4">
                {instructions}
              </Text>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-4">
          <CardContent>
            <Text variant="caption" tone="muted">
              Last performed
            </Text>

            {mostRecentHistory && completedSetSummary ? (
              <View className="mt-4">
                <Text variant="h3">{completedSetSummary}</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  {formatWorkoutDate(mostRecentHistory.workout.startedAt)}
                </Text>
              </View>
            ) : (
              <View className="mt-4">
                <Text variant="h3">No history yet</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Log a workout to see stats
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <Text variant="caption" tone="muted">
              History
            </Text>

            {history.length === 0 ? (
              <View className="mt-4">
                <Text variant="h3">No history yet</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Log a workout to see your history here.
                </Text>
              </View>
            ) : (
              history.map((historyEntry, historyIndex) => {
                return (
                  <View key={historyEntry.workout.id}>
                    <Text variant="caption" tone="muted" className="mt-4 mb-2">
                      {formatWorkoutDate(historyEntry.workout.startedAt)} ·{' '}
                      {historyEntry.sets.length} sets
                    </Text>

                    {historyEntry.sets.map((set, index) => {
                      const isBestSet = set.id === historyEntry.bestSetId;

                      return (
                        <View
                          key={set.id}
                          className={cn(
                            'flex-row items-center gap-3 py-1',
                            isBestSet && 'bg-success/10 rounded-md'
                          )}
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
                          <View className="ml-1 w-10">
                            {isBestSet ? (
                              <Text variant="caption" className="text-success">
                                Best
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}

                    {historyIndex < history.length - 1 && (
                      <View className="border-border mt-4 border-b" />
                    )}
                  </View>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <Text variant="caption" tone="muted">
              Personal records
            </Text>

            {prRows.length === 0 ? (
              <View className="mt-4">
                <Text variant="h3">No PRs yet</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Beat your best estimated 1RM to set a PR.
                </Text>
              </View>
            ) : (
              <View className="mt-4">
                {prRows.map((pr, index) => (
                  <View
                    key={pr.id}
                    className={cn(
                      'flex-row items-center justify-between py-3',
                      index < prRows.length - 1 && 'border-border border-b'
                    )}
                  >
                    <View className="flex-1">
                      <Text variant="bodyMedium">
                        {formatWeightForUnit(pr.weightKg, weightUnit)}{' '}
                        {weightUnit} x {pr.reps}
                      </Text>
                      <Text variant="caption" tone="muted" className="mt-1">
                        {formatWorkoutDate(pr.achievedAt)}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text variant="caption" tone="muted">
                        Est. 1RM
                      </Text>
                      <Text variant="bodyMedium" className="mt-1">
                        {formatWeightForUnit(pr.estimated1rm, weightUnit)}{' '}
                        {weightUnit}
                      </Text>
                    </View>

                    <View className="ml-3 w-12 items-end">
                      {index === 0 ? (
                        <View className="bg-success/15 rounded-md px-2 py-1">
                          <Text variant="caption" className="text-success">
                            Best
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </Screen>

      {isCustomExercise ? (
        <EditExerciseNameSheet
          isOpen={isEditNameOpen}
          exercise={exercise}
          exercises={exercises}
          onClose={() => setIsEditNameOpen(false)}
        />
      ) : null}
    </>
  );
}

import { BackButton } from '@/src/components/ui/back-button';
import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { useExerciseDetail } from '@/src/features/exercises/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { formatMuscleList } from '@/src/lib/utils/muscle';
import { getRouteParamId } from '@/src/lib/utils/route';
import { toTitleCase } from '@/src/lib/utils/string';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const exerciseId = getRouteParamId(id);
  const {
    exercise,
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

  return (
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

      <Card className="mt-6">
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
  );
}

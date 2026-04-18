import { useDrizzle } from '@/src/components/database-provider';
import { BackButton } from '@/src/components/ui/back-button';
import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { personalRecords } from '@/src/db/schema';
import { getExerciseByIdQuery } from '@/src/features/exercises/repository';
import {
  buildExerciseHistory,
  computeEstimated1RM,
  getExerciseHistorySetsQuery,
  getExerciseHistoryWorkoutsQuery,
  rebuildPersonalRecordsForExercise
} from '@/src/features/progress/repository';
import { useSettings } from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { formatMuscleList, parseMuscleList } from '@/src/lib/utils/muscle';
import { getRouteParamId } from '@/src/lib/utils/route';
import { formatCompletedSets, getCompletedSets } from '@/src/lib/utils/set';
import { toTitleCase } from '@/src/lib/utils/string';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

export default function ExerciseDetailScreen() {
  const db = useDrizzle();
  const { weightUnit } = useSettings();

  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const exerciseId = getRouteParamId(id);

  const { data: exerciseRows = [], updatedAt: exerciseUpdatedAt } =
    useLiveQuery(getExerciseByIdQuery(db, exerciseId ?? ''), [db, exerciseId]);
  const exercise = exerciseRows[0];

  const { data: workoutRows = [] } = useLiveQuery(
    getExerciseHistoryWorkoutsQuery(db, exerciseId ?? ''),
    [db, exerciseId]
  );
  const workoutIds = Array.from(
    new Set(workoutRows.map(row => row.workout.id))
  ).slice(0, 20);
  const { data: setRows = [] } = useLiveQuery(
    getExerciseHistorySetsQuery(db, exerciseId ?? '', workoutIds),
    [db, exerciseId, workoutIds.join(',')]
  );
  const { data: prRows = [] } = useLiveQuery(
    db
      .select()
      .from(personalRecords)
      .where(eq(personalRecords.exerciseId, exerciseId ?? ''))
      .orderBy(desc(personalRecords.achievedAt)),
    [db, exerciseId]
  );
  const history = useMemo(
    () =>
      buildExerciseHistory(workoutRows, setRows)
        .map(entry => ({
          ...entry,
          sets: entry.sets.filter(set => set.status === 'completed')
        }))
        .filter(entry => entry.sets.length > 0)
        .slice(0, 10),
    [setRows, workoutRows]
  );

  useEffect(() => {
    if (!exerciseId || !exerciseUpdatedAt) {
      return;
    }

    rebuildPersonalRecordsForExercise(db, exerciseId);
  }, [db, exerciseId, exerciseUpdatedAt]);

  if (exerciseId && !exerciseUpdatedAt) {
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

  const primaryMuscles = parseMuscleList(exercise.primaryMuscles);
  const secondaryMuscles = parseMuscleList(exercise.secondaryMuscles);
  const instructions = exercise.instructions?.trim();

  const mostRecentHistory = buildExerciseHistory(workoutRows, setRows).find(
    historyEntry => getCompletedSets(historyEntry.sets).length > 0
  );
  const completedSets = mostRecentHistory
    ? getCompletedSets(mostRecentHistory.sets)
    : [];
  const completedSetSummary = formatCompletedSets(completedSets, weightUnit);

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
              const bestSet = historyEntry.sets.reduce((best, set) =>
                computeEstimated1RM(set.weightKg, set.reps) >
                computeEstimated1RM(best.weightKg, best.reps)
                  ? set
                  : best
              );

              return (
                <View key={historyEntry.workout.id}>
                  <Text variant="caption" tone="muted" className="mt-4 mb-2">
                    {formatWorkoutDate(historyEntry.workout.startedAt)} ·{' '}
                    {historyEntry.sets.length} sets
                  </Text>

                  {historyEntry.sets.map((set, index) => {
                    const isBestSet = set.id === bestSet.id;

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

import { useDrizzle } from '@/src/components/database-provider';
import { BackButton } from '@/src/components/ui/back-button';
import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { getExerciseByIdQuery } from '@/src/features/exercises/repository';
import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getExerciseHistoryWorkoutsQuery
} from '@/src/features/progress/repository';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { formatMuscleList, parseMuscleList } from '@/src/lib/utils/muscle';
import { getRouteParamId } from '@/src/lib/utils/route';
import { formatCompletedSets, getCompletedSets } from '@/src/lib/utils/set';
import { toTitleCase } from '@/src/lib/utils/string';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function ExerciseDetailScreen() {
  const db = useDrizzle();

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
  const completedSetSummary = formatCompletedSets(completedSets);

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
    </Screen>
  );
}

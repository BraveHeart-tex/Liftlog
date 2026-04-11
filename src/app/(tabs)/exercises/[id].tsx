import { useDrizzle } from '@/src/components/database-provider';
import { Card, CardContent } from '@/src/components/ui/card';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { type Exercise, type Set } from '@/src/db/schema';
import { getExerciseByIdQuery } from '@/src/features/exercises/repository';
import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getExerciseHistoryWorkoutsQuery
} from '@/src/features/progress/repository';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

function getRouteParamId(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseMuscleList(value: Exercise['primaryMuscles']): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatMuscleList(muscles: string[]) {
  if (muscles.length === 0) {
    return 'Unspecified';
  }

  return muscles.map(toTitleCase).join(', ');
}

function formatWeight(weightKg: number) {
  if (Number.isInteger(weightKg)) {
    return String(weightKg);
  }

  return weightKg.toFixed(1);
}

function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

function formatCompletedSets(sets: Set[]) {
  if (sets.length === 0) {
    return undefined;
  }

  return sets
    .reduce<string[]>((parts, set, index) => {
      const previousSet = index > 0 ? sets[index - 1] : undefined;
      const hasSameWeightAsPrevious =
        previousSet && previousSet.weightKg === set.weightKg;

      if (hasSameWeightAsPrevious) {
        parts.push(String(set.reps));
        return parts;
      }

      parts.push(`${formatWeight(set.weightKg)} x ${set.reps}`);
      return parts;
    }, [])
    .join(', ');
}

function formatWorkoutDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(timestamp));
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const db = useDrizzle();

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
    return <Screen withPadding={false}>{null}</Screen>;
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
        <Text variant="h1">{exercise.name}</Text>
        <Text variant="small" tone="muted" className="mt-2">
          {toTitleCase(exercise.category)}
        </Text>
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

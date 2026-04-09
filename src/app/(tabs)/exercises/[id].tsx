import { useDrizzle } from '@/src/components/database-provider';
import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { type Exercise, type Set } from '@/src/db/schema';
import { getExerciseById } from '@/src/features/exercises/repository';
import { getExerciseHistory } from '@/src/features/progress/repository';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

function getLastCompletedSet(sets: Set[]) {
  for (let index = sets.length - 1; index >= 0; index -= 1) {
    const set = sets[index];

    if (set.status === 'completed') {
      return set;
    }
  }

  return undefined;
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
  const exercise = exerciseId ? getExerciseById(db, exerciseId) : undefined;

  if (!exercise) {
    return (
      <SafeAreaView
        style={{ flex: 1 }}
        className="bg-background"
        edges={['top']}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text variant="h3" className="text-center">
            Exercise not found
          </Text>
          <Text variant="small" tone="muted" className="mt-2 text-center">
            The exercise you&apos;re looking for doesn&apos;t exist.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const primaryMuscles = parseMuscleList(exercise.primaryMuscles);
  const secondaryMuscles = parseMuscleList(exercise.secondaryMuscles);
  const instructions = exercise.instructions?.trim();

  const mostRecentHistory = getExerciseHistory(db, exercise.id)[0];
  const lastCompletedSet = mostRecentHistory
    ? getLastCompletedSet(mostRecentHistory.sets)
    : undefined;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
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

            {mostRecentHistory && lastCompletedSet ? (
              <View className="mt-4">
                <Text variant="h3">
                  {formatWeight(lastCompletedSet.weightKg)} x{' '}
                  {lastCompletedSet.reps}
                </Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

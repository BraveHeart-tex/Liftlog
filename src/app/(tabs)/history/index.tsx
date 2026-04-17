import { useDrizzle } from '@/src/components/database-provider';
import { StyledFlatList } from '@/src/components/styled/flat-list';
import { LoadingState } from '@/src/components/ui/loading-state';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import type { DrizzleDb } from '@/src/db/client';
import {
  workoutExercises,
  type Workout,
  type WorkoutExercise
} from '@/src/db/schema';
import {
  getSetsForWorkoutExercisesQuery,
  getWorkoutExercisesQuery,
  getWorkoutsQuery
} from '@/src/features/workouts/repository';
import { asc, inArray } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

function getWorkoutExercisesForWorkoutsQuery(
  db: DrizzleDb,
  workoutIds: Workout['id'][]
) {
  if (workoutIds.length === 0) {
    return getWorkoutExercisesQuery(db, '');
  }

  return db
    .select()
    .from(workoutExercises)
    .where(inArray(workoutExercises.workoutId, workoutIds))
    .orderBy(asc(workoutExercises.order));
}

function formatWorkoutDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(timestamp));
}

function formatDuration(startedAt: number, completedAt: number | null): string {
  if (completedAt === null) {
    return '—';
  }

  const durationMinutes = Math.round((completedAt - startedAt) / 60000);

  if (durationMinutes < 1) {
    return '< 1 min';
  }

  return `${durationMinutes} min`;
}

export default function HistoryScreen() {
  const db = useDrizzle();
  const { data: workoutRows = [], updatedAt } = useLiveQuery(
    getWorkoutsQuery(db),
    [db]
  );

  const workoutIds = useMemo(
    () => workoutRows.map(workout => workout.id),
    [workoutRows]
  );

  const { data: workoutExerciseRows = [] } = useLiveQuery(
    getWorkoutExercisesForWorkoutsQuery(db, workoutIds),
    [db, workoutIds]
  );

  const workoutExerciseIds = useMemo(
    () => workoutExerciseRows.map(workoutExercise => workoutExercise.id),
    [workoutExerciseRows]
  );

  const { data: setRows = [] } = useLiveQuery(
    getSetsForWorkoutExercisesQuery(db, workoutExerciseIds),
    [db, workoutExerciseIds]
  );

  const setCountByWorkoutId = useMemo(() => {
    const workoutIdByExerciseId = new Map<
      WorkoutExercise['id'],
      Workout['id']
    >();

    for (const workoutExercise of workoutExerciseRows) {
      workoutIdByExerciseId.set(workoutExercise.id, workoutExercise.workoutId);
    }

    const nextSetCountByWorkoutId = new Map<Workout['id'], number>();

    for (const set of setRows) {
      if (set.status !== 'completed') {
        continue;
      }

      const workoutId = workoutIdByExerciseId.get(set.workoutExerciseId);

      if (!workoutId) {
        continue;
      }

      nextSetCountByWorkoutId.set(
        workoutId,
        (nextSetCountByWorkoutId.get(workoutId) ?? 0) + 1
      );
    }

    return nextSetCountByWorkoutId;
  }, [setRows, workoutExerciseRows]);

  if (!updatedAt) {
    return (
      <SafeAreaView
        style={{ flex: 1 }}
        className="bg-background"
        edges={['top']}
      >
        <LoadingState label="Loading history..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <StyledFlatList
        data={workoutRows}
        keyExtractor={item => item.id}
        style={{ flex: 1 }}
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-6">
            <Text variant="h1">History</Text>
            <Text variant="small" tone="muted" className="mt-2">
              Your completed workout sessions.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text variant="h3" className="text-center">
              No workouts yet
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Complete your first session to see it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const setCount = setCountByWorkoutId.get(item.id) ?? 0;

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/history/[id]',
                  params: { id: item.id }
                } as unknown as Href)
              }
              className="border-border bg-card mt-3 rounded-lg border p-4"
            >
              <View className="flex-row items-start justify-between gap-4">
                <Text variant="bodyMedium" className="flex-1">
                  {item.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {formatDuration(item.startedAt, item.completedAt)}
                </Text>
              </View>

              <View className="mt-2 flex-row items-center justify-between gap-4">
                <Text variant="caption" tone="muted" className="flex-1">
                  {formatWorkoutDate(item.startedAt)}
                </Text>
                <Text variant="caption" tone="muted">
                  {setCount} {setCount === 1 ? 'set' : 'sets'}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

import { useDrizzle } from '@/src/components/database-provider';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  workouts,
  type Exercise,
  type Set,
  type WorkoutExercise
} from '@/src/db/schema';
import {
  createWorkout,
  createWorkoutExercise,
  getActiveWorkoutQuery,
  getSetsForWorkoutExercisesQuery,
  getWorkoutExercisesQuery
} from '@/src/features/workouts/repository';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { getRouteParamId } from '@/src/lib/utils/route';
import { formatWeight } from '@/src/lib/utils/weight';
import { eq, inArray } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

function getExercisesForWorkoutQuery(
  db: DrizzleDb,
  exerciseIds: Exercise['id'][]
) {
  if (exerciseIds.length === 0) {
    return db
      .select()
      .from(exercises)
      .where(inArray(exercises.id, ['']));
  }

  return db.select().from(exercises).where(inArray(exercises.id, exerciseIds));
}

export default function WorkoutHistoryDetailScreen() {
  const db = useDrizzle();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getRouteParamId(id);

  const { data: workoutRows = [], updatedAt: workoutUpdatedAt } = useLiveQuery(
    db
      .select()
      .from(workouts)
      .where(eq(workouts.id, workoutId ?? '')),
    [db, workoutId]
  );
  const workout = workoutRows[0];

  const { data: activeWorkoutRows = [] } = useLiveQuery(
    getActiveWorkoutQuery(db),
    [db]
  );
  const activeWorkout = activeWorkoutRows[0];

  const {
    data: workoutExerciseRows = [],
    updatedAt: workoutExercisesUpdatedAt
  } = useLiveQuery(getWorkoutExercisesQuery(db, workoutId ?? ''), [
    db,
    workoutId
  ]);

  const workoutExerciseIds = useMemo(
    () => workoutExerciseRows.map(workoutExercise => workoutExercise.id),
    [workoutExerciseRows]
  );
  const workoutExerciseIdKey = workoutExerciseIds.join(',');

  const { data: setRows = [] } = useLiveQuery(
    getSetsForWorkoutExercisesQuery(db, workoutExerciseIds),
    [db, workoutExerciseIdKey]
  );

  const exerciseIds = useMemo(
    () =>
      workoutExerciseRows.map(workoutExercise => workoutExercise.exerciseId),
    [workoutExerciseRows]
  );
  const exerciseIdKey = exerciseIds.join(',');

  const { data: exerciseRows = [] } = useLiveQuery(
    getExercisesForWorkoutQuery(db, exerciseIds),
    [db, exerciseIdKey]
  );

  const exerciseById = useMemo(
    () =>
      new Map<Exercise['id'], Exercise>(
        exerciseRows.map(exercise => [exercise.id, exercise])
      ),
    [exerciseRows]
  );

  const setsByWorkoutExerciseId = useMemo(() => {
    const nextSetsByWorkoutExerciseId = new Map<WorkoutExercise['id'], Set[]>();

    for (const set of setRows) {
      if (set.status !== 'completed') {
        continue;
      }

      const existingSets =
        nextSetsByWorkoutExerciseId.get(set.workoutExerciseId) ?? [];

      nextSetsByWorkoutExerciseId.set(set.workoutExerciseId, [
        ...existingSets,
        set
      ]);
    }

    return nextSetsByWorkoutExerciseId;
  }, [setRows]);

  const totalVolume = useMemo(() => {
    const volume = setRows.reduce((total, set) => {
      if (set.status !== 'completed') {
        return total;
      }

      return total + set.weightKg * set.reps;
    }, 0);

    return Math.round(volume * 10) / 10;
  }, [setRows]);

  const totalCompletedSets = useMemo(
    () => setRows.filter(set => set.status === 'completed').length,
    [setRows]
  );

  const handleRepeatWorkout = () => {
    if (!workout || (!activeWorkout && !workoutExercisesUpdatedAt)) {
      return;
    }

    if (activeWorkout) {
      router.push('/(tabs)/workout/active');

      return;
    }

    const newWorkout = createWorkout(db, {
      name: workout.name,
      status: 'in_progress',
      startedAt: Date.now()
    });

    for (const workoutExercise of workoutExerciseRows) {
      createWorkoutExercise(db, {
        workoutId: newWorkout.id,
        exerciseId: workoutExercise.exerciseId,
        order: workoutExercise.order,
        notes: null
      });
    }

    router.push('/(tabs)/workout/active');
  };

  if (workoutId && !workoutUpdatedAt) {
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
              {totalVolume} kg
            </Text>
          </CardContent>
        </Card>
      </View>

      <View className="mt-6">
        <Text variant="caption" tone="muted" className="mb-3">
          Exercises
        </Text>

        {workoutExerciseRows.map(workoutExercise => {
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
                          {formatWeight(set.weightKg)} kg
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
        })}
      </View>

      <Button
        variant="secondary"
        className="mt-6 w-full"
        disabled={!activeWorkout && !workoutExercisesUpdatedAt}
        onPress={handleRepeatWorkout}
      >
        {activeWorkout ? 'Resume active workout' : 'Repeat this workout'}
      </Button>
    </Screen>
  );
}

import { useDrizzle } from '@/src/components/database-provider';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { workouts, type Workout } from '@/src/db/schema';
import {
  createWorkout,
  getActiveWorkout,
  getWorkouts
} from '@/src/features/workouts/repository';
import { cn } from '@/src/lib/utils/cn';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type WorkoutLiveQuery<TData> = Pick<AnySQLiteSelect, '_' | 'then'> & {
  config: {
    table: typeof workouts;
  };
  then<TResult1 = TData, TResult2 = never>(
    onfulfilled?: ((value: TData) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
};

const activeWorkoutRoute = '/(tabs)/workout/active' as Href;

function createWorkoutLiveQuery<TData>(
  getData: () => TData
): WorkoutLiveQuery<TData> {
  return {
    _: undefined as unknown as AnySQLiteSelect['_'],
    config: {
      table: workouts
    },
    then(onfulfilled, onrejected) {
      return Promise.resolve().then(getData).then(onfulfilled, onrejected);
    }
  };
}

function formatWorkoutName(date: Date): string {
  return `${date.toLocaleDateString(undefined, { weekday: 'long' })} workout`;
}

function formatWorkoutDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(timestamp));
}

function formatDuration(startedAt: number, completedAt: number | null): string {
  const end = completedAt ?? Date.now();
  const durationMs = end - startedAt;

  if (durationMs < 60000) {
    return '< 1 min';
  }

  return `${Math.round(durationMs / 60000)} min`;
}

export default function WorkoutStartScreen() {
  const db = useDrizzle();
  const [now, setNow] = useState(() => Date.now());
  const { data: activeWorkoutData } = useLiveQuery(
    createWorkoutLiveQuery<Workout | undefined>(() => getActiveWorkout(db)),
    [db]
  );
  const { data: completedWorkouts = [] } = useLiveQuery(
    createWorkoutLiveQuery<Workout[]>(() => getWorkouts(db)),
    [db]
  );

  const activeWorkout = Array.isArray(activeWorkoutData)
    ? undefined
    : activeWorkoutData;
  const recentWorkouts = completedWorkouts.slice(0, 5);

  useEffect(() => {
    if (!activeWorkout) {
      return;
    }

    setNow(Date.now());

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeWorkout]);

  const handleStartWorkout = () => {
    createWorkout(db, {
      name: formatWorkoutName(new Date()),
      status: 'in_progress'
    });

    router.push(activeWorkoutRoute);
  };

  const handleResumeWorkout = () => {
    router.push(activeWorkoutRoute);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="h1">Workout</Text>
          <Text variant="small" tone="muted" className="mt-2">
            Start a new session or resume where you left off.
          </Text>
        </View>

        {activeWorkout ? (
          <Pressable onPress={handleResumeWorkout} className="mt-6">
            <Card className="border-primary">
              <CardContent>
                <Text variant="caption" tone="muted">
                  Workout in progress
                </Text>
                <Text variant="h3" className="mt-2">
                  {activeWorkout.name}
                </Text>
                <Text variant="small" tone="muted" className="mt-2">
                  {formatDuration(activeWorkout.startedAt, now)}
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        ) : (
          <>
            <Button className="mt-6 w-full" onPress={handleStartWorkout}>
              Start Workout
            </Button>

            <View className="mt-8">
              <Text variant="caption" tone="muted">
                Recent workouts
              </Text>

              {recentWorkouts.length > 0 ? (
                <View className="mt-3">
                  {recentWorkouts.map((workout, index) => (
                    <Pressable
                      key={workout.id}
                      // TODO: repeat workout (phase 4.2)
                      onPress={() => {}}
                      className={cn(
                        'border-border bg-card rounded-lg border p-4',
                        index > 0 && 'mt-3'
                      )}
                    >
                      <Text variant="bodyMedium">{workout.name}</Text>
                      <View className="mt-2 flex-row items-center gap-3">
                        <Text variant="caption" tone="muted">
                          {formatWorkoutDate(workout.startedAt)}
                        </Text>
                        <Text variant="caption" tone="muted">
                          {formatDuration(
                            workout.startedAt,
                            workout.completedAt
                          )}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View className="border-border bg-card mt-3 items-center justify-center rounded-lg border border-dashed px-6 py-10">
                  <Text variant="h3" className="text-center">
                    No workouts yet
                  </Text>
                  <Text
                    variant="small"
                    tone="muted"
                    className="mt-2 text-center"
                  >
                    Start your first session to see history here.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

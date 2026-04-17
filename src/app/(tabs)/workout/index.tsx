import { useDrizzle } from '@/src/components/database-provider';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import {
  createWorkout,
  getActiveWorkoutQuery,
  getWorkoutsQuery
} from '@/src/features/workouts/repository';
import { cn } from '@/src/lib/utils/cn';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { formatWorkoutName } from '@/src/lib/utils/workout';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

const activeWorkoutRoute = '/(tabs)/workout/active' as Href;

export default function WorkoutStartScreen() {
  const db = useDrizzle();
  const [now, setNow] = useState(() => Date.now());
  const { data: activeWorkoutRows = [] } = useLiveQuery(
    getActiveWorkoutQuery(db),
    [db]
  );
  const { data: completedWorkouts = [] } = useLiveQuery(getWorkoutsQuery(db), [
    db
  ]);

  const activeWorkout = activeWorkoutRows[0];
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
    <Screen scroll>
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
                {formatDuration({
                  startedAt: activeWorkout.startedAt,
                  completedAt: now
                })}
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
                    onPress={() => {
                      router.push(`/(tabs)/history/${workout.id}`);
                    }}
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
                        {formatDuration({
                          startedAt: workout.startedAt,
                          completedAt: workout.completedAt
                        })}
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
                <Text variant="small" tone="muted" className="mt-2 text-center">
                  Start your first session to see history here.
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

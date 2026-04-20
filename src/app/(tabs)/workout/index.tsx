import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import {
  useStartWorkout,
  useWorkoutStart
} from '@/src/features/workouts/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

export default function WorkoutStartScreen() {
  const [now, setNow] = useState(() => Date.now());
  const { activeWorkout, recentWorkouts } = useWorkoutStart();
  const { startWorkout, resumeWorkout } = useStartWorkout();

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

  return (
    <Screen scroll>
      {/* no keyboard avoiding needed — no text inputs on this screen */}
      <View>
        <Text variant="h1">Workout</Text>
        <Text variant="small" tone="muted" className="mt-2">
          Start a new session or resume where you left off.
        </Text>
      </View>

      {activeWorkout ? (
        <Pressable onPress={resumeWorkout} className="mt-6">
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
          <Button className="mt-6 w-full" onPress={startWorkout}>
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
                      router.push({
                        pathname: '/workouts/[id]',
                        params: { id: workout.id }
                      } as unknown as Href);
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

import { Button } from '@/src/components/ui/button';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutSummaryCard } from '@/src/features/workouts/components/active-workout-summary-card';
import { RecentWorkoutCard } from '@/src/features/workouts/components/recent-workout-card';
import { WorkoutTemplateCard } from '@/src/features/workouts/components/workout-template-card';
import { useWorkoutStart } from '@/src/features/workouts/hooks';
import { cn } from '@/src/lib/utils/cn';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function WorkoutStartScreen() {
  const [now, setNow] = useState(() => Date.now());

  const {
    activeWorkout,
    recentWorkouts,
    templates,
    startWorkout,
    resumeWorkout
  } = useWorkoutStart();

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

  const handleTemplatePress = (templateId: string) => {
    router.push({
      pathname: '/workouts/templates/[id]',
      params: { id: templateId }
    });
  };

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <View>
        <Text variant="h1">Workout</Text>
        <Text variant="small" tone="muted" className="mt-2">
          Start a new session or resume where you left off.
        </Text>
      </View>

      {activeWorkout ? (
        <ActiveWorkoutSummaryCard
          workout={activeWorkout}
          now={now}
          onPress={resumeWorkout}
        />
      ) : (
        <Button className="mt-6 w-full" onPress={startWorkout}>
          Start Workout
        </Button>
      )}

      {templates.length > 0 ? (
        <View className="mt-8">
          <Text variant="caption" tone="muted">
            Templates
          </Text>

          <View className="mt-3">
            {templates.map((item, index) => (
              <WorkoutTemplateCard
                key={item.template.id}
                item={item}
                className={cn(index > 0 && 'mt-3')}
                onPress={() => handleTemplatePress(item.template.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View className="mt-8">
        <Text variant="caption" tone="muted">
          Recent workouts
        </Text>

        {recentWorkouts.length > 0 ? (
          <View className="mt-3">
            {recentWorkouts.map((workout, index) => (
              <RecentWorkoutCard
                key={workout.id}
                workout={workout}
                className={cn(index > 0 && 'mt-3')}
                onPress={() => {
                  router.push({
                    pathname: '/workouts/[id]',
                    params: { id: workout.id }
                  } as unknown as Href);
                }}
              />
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
    </Screen>
  );
}

import { StyledFlatList } from '@/src/components/styled/flat-list';
import { LoadingState } from '@/src/components/ui/loading-state';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import {
  getWorkoutCountByDateKey,
  toLocalDateKey,
  WorkoutHistoryCalendar
} from '@/src/features/workouts/components/workout-history-calendar';
import { useHistoryList } from '@/src/features/workouts/hooks';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

function formatSelectedDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(date);
}

export default function HistoryScreen() {
  const { workoutRows, setCountByWorkoutId, isLoading } = useHistoryList();
  const workoutCountByDateKey = useMemo(
    () => getWorkoutCountByDateKey(workoutRows),
    [workoutRows]
  );
  const initialDateKey = workoutRows[0]
    ? toLocalDateKey(workoutRows[0].startedAt)
    : toLocalDateKey(Date.now());
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const selectedWorkouts = useMemo(
    () =>
      workoutRows.filter(
        workout => toLocalDateKey(workout.startedAt) === selectedDateKey
      ),
    [selectedDateKey, workoutRows]
  );

  if (isLoading) {
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
        data={selectedWorkouts}
        keyExtractor={item => item.id}
        style={{ flex: 1 }}
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-6">
            <Text variant="h1">History</Text>
            <Text variant="small" tone="muted" className="mt-2">
              Browse completed sessions by day.
            </Text>

            <View className="mt-6">
              <WorkoutHistoryCalendar
                selectedDateKey={selectedDateKey}
                workoutCountByDateKey={workoutCountByDateKey}
                onSelectDate={setSelectedDateKey}
              />
            </View>

            <View className="mt-6 flex-row items-end justify-between gap-4">
              <View>
                <Text variant="caption" tone="muted">
                  Selected day
                </Text>
                <Text variant="h3" className="mt-1">
                  {formatSelectedDate(selectedDateKey)}
                </Text>
              </View>
              <Text variant="caption" tone="muted">
                {selectedWorkouts.length}{' '}
                {selectedWorkouts.length === 1 ? 'workout' : 'workouts'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="border-border bg-card items-center justify-center rounded-lg border border-dashed px-6 py-10">
            <Text variant="h3" className="text-center">
              No workouts
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Completed sessions for this day will show here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const setCount = setCountByWorkoutId.get(item.id) ?? 0;

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/workouts/[id]',
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
                  {formatDuration({
                    startedAt: item.startedAt,
                    completedAt: item.completedAt
                  })}
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

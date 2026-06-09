import { StyledFlatList } from '@/src/components/styled/flat-list';
import { Text } from '@/src/components/ui/text';
import { WorkoutLogCalendar } from '@/src/features/workout-log/components/workout-log-calendar';
import { WorkoutLogRow } from '@/src/features/workout-log/components/workout-log-row';
import {
  useWorkoutCalendarMarks,
  useWorkoutRowsForDate
} from '@/src/features/workouts/hooks';
import type { CompletedWorkoutLogRow } from '@/src/features/workouts/repository';
import { toLocalDateKey } from '@/src/lib/utils/date';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

const WORKOUT_LOG_PAST_MONTH_RANGE = 24;

function formatSelectedDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(date);
}

export function WorkoutLogContent() {
  const [selectedDateKey, setSelectedDateKey] = useState(
    toLocalDateKey(Date.now())
  );
  const { workoutCountByDateKey } = useWorkoutCalendarMarks(
    WORKOUT_LOG_PAST_MONTH_RANGE
  );
  const { workoutRows } = useWorkoutRowsForDate(selectedDateKey);

  const renderWorkoutRow = useCallback(
    ({ item }: { item: CompletedWorkoutLogRow }) => (
      <WorkoutLogRow
        workout={item.workout}
        setCount={item.setCount}
        onPress={workout =>
          router.push({
            pathname: '/workouts/[id]',
            params: { id: workout.id }
          })
        }
      />
    ),
    []
  );

  const listHeader = useMemo(
    () => (
      <View className="mb-6">
        <Text variant="small" tone="muted">
          Browse completed sessions by day.
        </Text>

        <View className="mt-6">
          <WorkoutLogCalendar
            pastMonthRange={WORKOUT_LOG_PAST_MONTH_RANGE}
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
            {`${workoutRows.length} ${
              workoutRows.length === 1 ? 'workout' : 'workouts'
            }`}
          </Text>
        </View>
      </View>
    ),
    [selectedDateKey, workoutCountByDateKey, workoutRows.length]
  );

  return (
    <StyledFlatList
      data={workoutRows}
      className="flex-1"
      directionalLockEnabled
      keyExtractor={item => item.workout.id}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={listHeader}
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
      renderItem={renderWorkoutRow}
      contentContainerClassName="px-4 pt-4 pb-6"
    />
  );
}

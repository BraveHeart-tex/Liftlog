import { StyledFlashList } from '@/src/components/styled/flash-list';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import { WorkoutLogCalendar } from '@/src/features/workout-log/components/workout-log-calendar';
import { WorkoutLogRow } from '@/src/features/workout-log/components/workout-log-row';
import {
  useWorkoutCalendarMarks,
  useWorkoutRowsForDate
} from '@/src/features/workouts/hooks';
import type { CompletedWorkoutLogRow } from '@/src/features/workouts/repository';
import { toLocalDateKey } from '@/src/lib/utils/date';
import type { FlashListRef } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

function formatSelectedDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(date);
}

const WORKOUT_LOG_PAST_MONTH_RANGE = 24;

export default function LogScreen() {
  const [selectedDateKey, setSelectedDateKey] = useState(
    toLocalDateKey(Date.now())
  );
  const logListRef = useRef<FlashListRef<CompletedWorkoutLogRow>>(null);
  const { workoutCountByDateKey } = useWorkoutCalendarMarks(
    WORKOUT_LOG_PAST_MONTH_RANGE
  );
  const { workoutRows } = useWorkoutRowsForDate(selectedDateKey);

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
  }, []);

  const handleCalendarScrollLockChange = useCallback((isLocked: boolean) => {
    logListRef.current
      ?.getNativeScrollRef()
      ?.setNativeProps({ scrollEnabled: !isLocked });
  }, []);

  const renderWorkoutRow = useCallback(
    ({ item }: { item: CompletedWorkoutLogRow }) => {
      return (
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
      );
    },
    []
  );

  const listHeader = useMemo(
    () => (
      <View className="mb-6">
        <Text variant="h1">Log</Text>
        <Text variant="small" tone="muted" className="mt-2">
          Browse completed sessions by day.
        </Text>

        <View className="mt-6">
          <WorkoutLogCalendar
            pastMonthRange={WORKOUT_LOG_PAST_MONTH_RANGE}
            selectedDateKey={selectedDateKey}
            workoutCountByDateKey={workoutCountByDateKey}
            onSelectDate={handleSelectDate}
            onScrollLockChange={handleCalendarScrollLockChange}
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
    [
      handleCalendarScrollLockChange,
      handleSelectDate,
      selectedDateKey,
      workoutCountByDateKey,
      workoutRows.length
    ]
  );

  const listEmptyComponent = useMemo(() => {
    return (
      <View className="border-border bg-card items-center justify-center rounded-lg border border-dashed px-6 py-10">
        <Text variant="h3" className="text-center">
          No workouts
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          Completed sessions for this day will show here.
        </Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback(
    (item: CompletedWorkoutLogRow) => item.workout.id,
    []
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <StyledFlashList
        ref={logListRef}
        data={workoutRows}
        keyExtractor={keyExtractor}
        style={{ flex: 1 }}
        contentContainerClassName="px-4 py-6"
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyComponent}
        renderItem={renderWorkoutRow}
      />
    </SafeAreaView>
  );
}

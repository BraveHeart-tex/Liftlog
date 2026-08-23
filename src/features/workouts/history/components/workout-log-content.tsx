import { StyledFlatList } from '@/src/components/styled/flat-list';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { WorkoutLogCalendar } from '@/src/features/workouts/history/components/workout-log-calendar';
import { WorkoutLogRow } from '@/src/features/workouts/history/components/workout-log-row';
import { WorkoutLogStartSheet } from '@/src/features/workouts/history/components/workout-log-start-sheet';
import type { CompletedWorkoutLogRow } from '@/src/features/workouts/history/history.repository';
import {
  useWorkoutCalendarMarks,
  useWorkoutRowsForDate
} from '@/src/features/workouts/history/hooks/use-workout-log';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutUp,
  ReduceMotion
} from 'react-native-reanimated';

const WORKOUT_LOG_PAST_MONTH_RANGE = 12;
const workoutLogEaseOut = Easing.bezier(0.23, 1, 0.32, 1);
const workoutRowEntering = FadeInDown.duration(MOTION_DURATION_MS.standard)
  .easing(workoutLogEaseOut)
  .reduceMotion(ReduceMotion.System);
const workoutRowExiting = FadeOutUp.duration(MOTION_DURATION_MS.exit)
  .easing(workoutLogEaseOut)
  .reduceMotion(ReduceMotion.System);
const selectedDayEntering = FadeIn.duration(MOTION_DURATION_MS.standard)
  .easing(workoutLogEaseOut)
  .reduceMotion(ReduceMotion.System);

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
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
  const { workoutCountByDateKey } = useWorkoutCalendarMarks(
    WORKOUT_LOG_PAST_MONTH_RANGE
  );
  const { workoutRows, isLive: areWorkoutRowsLive } =
    useWorkoutRowsForDate(selectedDateKey);
  const openStartSheet = useCallback(() => setIsStartSheetOpen(true), []);
  const closeStartSheet = useCallback(() => setIsStartSheetOpen(false), []);

  const renderWorkoutRow = useCallback(
    ({ item }: { item: CompletedWorkoutLogRow }) => (
      <Animated.View
        key={`${selectedDateKey}-${item.workout.id}`}
        entering={workoutRowEntering}
        exiting={workoutRowExiting}
      >
        <WorkoutLogRow
          workout={item.workout}
          setCount={item.setCount}
          onPress={workout =>
            router.navigate({
              pathname: '/workouts/[id]',
              params: { id: workout.id }
            })
          }
        />
      </Animated.View>
    ),
    [selectedDateKey]
  );

  const workoutCountLabel = `${workoutRows.length} ${
    workoutRows.length === 1 ? 'workout' : 'workouts'
  }`;
  const hasWorkoutRows = workoutRows.length > 0;

  const listHeader = useMemo(
    () => (
      <View className="mb-1">
        <View className="mt-4">
          <WorkoutLogCalendar
            pastMonthRange={WORKOUT_LOG_PAST_MONTH_RANGE}
            selectedDateKey={selectedDateKey}
            workoutCountByDateKey={workoutCountByDateKey}
            onSelectDate={setSelectedDateKey}
          />
        </View>

        <Animated.View
          key={selectedDateKey}
          className="mt-4 flex-row items-end justify-between gap-4"
          entering={selectedDayEntering}
        >
          <View>
            <Text variant="caption" tone="muted">
              Selected day
            </Text>
            <Text variant="h3" className="mt-1">
              {formatSelectedDate(selectedDateKey)}
            </Text>
          </View>
          <Text variant="caption" tone="muted">
            {workoutCountLabel}
          </Text>
        </Animated.View>

        <View className="mt-4 min-h-11 flex-row items-center justify-between gap-4">
          <Text variant="overline" tone="muted">
            Workouts
          </Text>
          {hasWorkoutRows ? (
            <Button
              className="min-h-11 px-2"
              leftIcon={<Icon as={PlusIcon} tone="primary" size="sm" />}
              onPress={openStartSheet}
              size="sm"
              textClassName="text-small text-primary"
              variant="ghost"
            >
              Log workout
            </Button>
          ) : null}
        </View>
      </View>
    ),
    [
      hasWorkoutRows,
      openStartSheet,
      selectedDateKey,
      workoutCountByDateKey,
      workoutCountLabel
    ]
  );

  return (
    <>
      <StyledFlatList
        data={workoutRows}
        className="flex-1"
        directionalLockEnabled
        keyExtractor={item => item.workout.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          areWorkoutRowsLive ? (
            <EmptyState className="border-border bg-card rounded-lg border border-dashed px-6 py-10">
              <EmptyState.Title variant="bodyMedium">
                No workouts
              </EmptyState.Title>
              <EmptyState.Description>
                Completed sessions for this day will show here.
              </EmptyState.Description>
              <EmptyState.Action>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={
                    <Icon as={PlusIcon} tone="secondaryForeground" size="sm" />
                  }
                  onPress={openStartSheet}
                >
                  Log workout
                </Button>
              </EmptyState.Action>
            </EmptyState>
          ) : null
        }
        renderItem={renderWorkoutRow}
        extraData={selectedDateKey}
        contentContainerClassName="px-4 pt-4 pb-6"
      />

      {isStartSheetOpen ? (
        <WorkoutLogStartSheet
          dateKey={selectedDateKey}
          isOpen
          onClose={closeStartSheet}
        />
      ) : null}
    </>
  );
}

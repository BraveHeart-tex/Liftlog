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
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';

const WORKOUT_LOG_PAST_MONTH_RANGE = 12;
const WORKOUT_LIST_EXIT_DURATION_MS = 110;
const WORKOUT_LIST_ENTER_DURATION_MS = 220;
const WORKOUT_LIST_REDUCED_EXIT_DURATION_MS = 90;
const WORKOUT_LIST_REDUCED_ENTER_DURATION_MS = 120;
const WORKOUT_LIST_EXIT_OFFSET = -3;
const WORKOUT_LIST_ENTER_OFFSET = 8;
const workoutListExitEasing = Easing.bezier(0.4, 0, 1, 1);
const workoutListEnterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

type WorkoutListTransitionPhase = 'idle' | 'exiting' | 'loading' | 'entering';

function WorkoutListTransitionContainer({
  children,
  opacity,
  translateY
}: {
  children: ReactNode;
  opacity: SharedValue<number>;
  translateY: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

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
  const [renderedDateKey, setRenderedDateKey] = useState(selectedDateKey);
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const workoutListOpacity = useSharedValue(1);
  const workoutListTranslateY = useSharedValue(0);
  const transitionIdRef = useRef(0);
  const transitionPhaseRef = useRef<WorkoutListTransitionPhase>('idle');
  const latestSelectedDateKeyRef = useRef(selectedDateKey);
  const skipFirstQueryStateRef = useRef(false);
  const { workoutCountByDateKey } = useWorkoutCalendarMarks(
    WORKOUT_LOG_PAST_MONTH_RANGE
  );
  const {
    workoutRows,
    isLive: areWorkoutRowsLive,
    error: workoutRowsError
  } = useWorkoutRowsForDate(renderedDateKey);
  const openStartSheet = useCallback(() => setIsStartSheetOpen(true), []);
  const closeStartSheet = useCallback(() => setIsStartSheetOpen(false), []);

  const showWorkoutRowsForDate = useCallback(
    (transitionId: number, dateKey: string) => {
      if (transitionId !== transitionIdRef.current) {
        return;
      }

      transitionPhaseRef.current = 'loading';
      skipFirstQueryStateRef.current = true;
      setRenderedDateKey(dateKey);
    },
    []
  );

  const finishWorkoutListTransition = useCallback((transitionId: number) => {
    if (transitionId === transitionIdRef.current) {
      transitionPhaseRef.current = 'idle';
    }
  }, []);

  const selectDate = useCallback(
    (dateKey: string) => {
      if (dateKey === latestSelectedDateKeyRef.current) {
        return;
      }

      latestSelectedDateKeyRef.current = dateKey;
      setSelectedDateKey(dateKey);

      const transitionId = ++transitionIdRef.current;
      cancelAnimation(workoutListOpacity);
      cancelAnimation(workoutListTranslateY);

      if (transitionPhaseRef.current === 'loading') {
        showWorkoutRowsForDate(transitionId, dateKey);

        return;
      }

      transitionPhaseRef.current = 'exiting';
      workoutListTranslateY.value = reduceMotion
        ? 0
        : withTiming(WORKOUT_LIST_EXIT_OFFSET, {
            duration: WORKOUT_LIST_EXIT_DURATION_MS,
            easing: workoutListExitEasing
          });
      workoutListOpacity.value = withTiming(
        0,
        {
          duration: reduceMotion
            ? WORKOUT_LIST_REDUCED_EXIT_DURATION_MS
            : WORKOUT_LIST_EXIT_DURATION_MS,
          easing: workoutListExitEasing
        },
        finished => {
          if (finished) {
            runOnJS(showWorkoutRowsForDate)(transitionId, dateKey);
          }
        }
      );
    },
    [
      reduceMotion,
      showWorkoutRowsForDate,
      workoutListOpacity,
      workoutListTranslateY
    ]
  );

  useEffect(() => {
    if (transitionPhaseRef.current !== 'loading') {
      return;
    }

    // The live-query hook resets after its key changes. Ignore the render that
    // still carries the previous key's live status before starting the enter.
    if (skipFirstQueryStateRef.current) {
      skipFirstQueryStateRef.current = false;

      return;
    }

    if (
      (!areWorkoutRowsLive && !workoutRowsError) ||
      renderedDateKey !== latestSelectedDateKeyRef.current
    ) {
      return;
    }

    transitionPhaseRef.current = 'entering';
    const transitionId = transitionIdRef.current;
    workoutListOpacity.value = 0;
    workoutListTranslateY.value = reduceMotion ? 0 : WORKOUT_LIST_ENTER_OFFSET;
    workoutListOpacity.value = withTiming(
      1,
      {
        duration: reduceMotion
          ? WORKOUT_LIST_REDUCED_ENTER_DURATION_MS
          : WORKOUT_LIST_ENTER_DURATION_MS,
        easing: workoutListEnterEasing
      },
      finished => {
        if (finished) {
          runOnJS(finishWorkoutListTransition)(transitionId);
        }
      }
    );
    workoutListTranslateY.value = withTiming(0, {
      duration: reduceMotion
        ? WORKOUT_LIST_REDUCED_ENTER_DURATION_MS
        : WORKOUT_LIST_ENTER_DURATION_MS,
      easing: workoutListEnterEasing
    });
  }, [
    areWorkoutRowsLive,
    finishWorkoutListTransition,
    reduceMotion,
    renderedDateKey,
    workoutListOpacity,
    workoutListTranslateY,
    workoutRowsError
  ]);

  const renderWorkoutRow = useCallback(
    ({ item }: { item: CompletedWorkoutLogRow }) => (
      <WorkoutListTransitionContainer
        opacity={workoutListOpacity}
        translateY={workoutListTranslateY}
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
      </WorkoutListTransitionContainer>
    ),
    [workoutListOpacity, workoutListTranslateY]
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
            onSelectDate={selectDate}
          />
        </View>

        <View className="mt-4 flex-row items-end justify-between gap-4">
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
        </View>

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
      selectDate,
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
            <WorkoutListTransitionContainer
              opacity={workoutListOpacity}
              translateY={workoutListTranslateY}
            >
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
                      <Icon
                        as={PlusIcon}
                        tone="secondaryForeground"
                        size="sm"
                      />
                    }
                    onPress={openStartSheet}
                  >
                    Log workout
                  </Button>
                </EmptyState.Action>
              </EmptyState>
            </WorkoutListTransitionContainer>
          ) : null
        }
        renderItem={renderWorkoutRow}
        extraData={renderedDateKey}
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

import { useDrizzle } from '@/src/components/database-provider';
import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { BackButton } from '@/src/components/ui/back-button';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import type { Exercise } from '@/src/db/schema';
import { getExercisesQuery } from '@/src/features/exercises/repository';
import { ExerciseHistoryTab } from '@/src/features/workouts/components/exercise-history-tab';
import { ExerciseTrackTab } from '@/src/features/workouts/components/exercise-track-tab';
import { RestTimerSheet } from '@/src/features/workouts/components/rest-timer-sheet';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/types';
import {
  getSetsByWorkoutExerciseIdQuery,
  getWorkoutExerciseByIdQuery
} from '@/src/features/workouts/repository';
import { cn } from '@/src/lib/utils/cn';
import { getRouteParamId } from '@/src/lib/utils/route';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView
} from 'react-native';

type ExerciseDetailTab = 'track' | 'history';

const tabs: ExerciseDetailTab[] = ['track', 'history'];

export default function ActiveWorkoutExerciseScreen() {
  const db = useDrizzle();

  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();
  const workoutExerciseId = getRouteParamId(rawId);

  const [selectedTab, setSelectedTab] = useState<ExerciseDetailTab>('track');
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  const {
    data: workoutExerciseRows = [],
    updatedAt: workoutExerciseUpdatedAt
  } = useLiveQuery(getWorkoutExerciseByIdQuery(db, workoutExerciseId ?? ''), [
    db,
    workoutExerciseId
  ]);
  const workoutExercise = workoutExerciseRows[0];
  const { data: setRows = [], updatedAt: setsUpdatedAt } = useLiveQuery(
    getSetsByWorkoutExerciseIdQuery(db, workoutExerciseId ?? ''),
    [db, workoutExerciseId]
  );
  const { data: exerciseRows = [] } = useLiveQuery(getExercisesQuery(db), [db]);
  const exerciseById = useMemo(
    () =>
      new Map<Exercise['id'], Exercise>(
        exerciseRows.map(exercise => [exercise.id, exercise])
      ),
    [exerciseRows]
  );

  const item = useMemo<WorkoutExerciseWithSets | undefined>(() => {
    if (!workoutExercise) {
      return undefined;
    }

    return {
      workoutExercise,
      exercise: exerciseById.get(workoutExercise.exerciseId),
      sets: setRows
    };
  }, [exerciseById, setRows, workoutExercise]);

  const handleSelectTab = (tab: ExerciseDetailTab) => {
    const tabIndex = tabs.indexOf(tab);

    setSelectedTab(tab);
    scrollRef.current?.scrollTo({
      x: tabIndex * width,
      animated: true
    });
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);

    setSelectedTab(tabs[pageIndex] ?? 'track');
  };

  if (workoutExerciseId && (!workoutExerciseUpdatedAt || !setsUpdatedAt)) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading exercise..." />
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Exercise not found
        </Text>
        <BackButton variant="text" className="mt-4" />
      </Screen>
    );
  }

  return (
    <Screen withPadding={false}>
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <BackButton />

          <Text variant="h2" className="flex-1" numberOfLines={1}>
            {item.exercise?.name ?? 'Unknown exercise'}
          </Text>
        </View>
      </View>

      <View className="border-border flex-row border-b px-4">
        {tabs.map(tab => {
          const isSelected = selectedTab === tab;

          return (
            <Pressable
              key={tab}
              onPress={() => handleSelectTab(tab)}
              className={cn(
                'flex-1 items-center py-3',
                isSelected && 'border-primary border-b-2'
              )}
            >
              <Text
                variant="bodyMedium"
                tone={isSelected ? 'default' : 'muted'}
              >
                {tab === 'track' ? 'Track' : 'History'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <StyledScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        <View className="w-screen flex-1">
          <ExerciseTrackTab
            db={db}
            item={item}
            onOpenRestTimer={() => setIsRestTimerOpen(true)}
          />
        </View>
        <View className="w-screen flex-1">
          <ExerciseHistoryTab
            db={db}
            exerciseId={item.workoutExercise.exerciseId}
          />
        </View>
      </StyledScrollView>

      <RestTimerSheet
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
        // TODO: read durationSeconds from user settings (phase 6.1)
        durationSeconds={90}
      />
    </Screen>
  );
}

import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ExerciseHistoryTab } from '@/src/features/workouts/components/exercise-history-tab';
import { ExerciseTrackTab } from '@/src/features/workouts/components/exercise-track-tab';
import {
  RestTimerSheet,
  timerRef
} from '@/src/features/workouts/components/rest-timer-sheet';
import { useActiveWorkoutExerciseDetail } from '@/src/features/workouts/hooks';
import { cn } from '@/src/lib/utils/cn';
import { getRouteParamId } from '@/src/lib/utils/route';
import { useLocalSearchParams } from 'expo-router';
import { TimerIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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
  const { workoutExerciseId: rawId } = useLocalSearchParams<{
    workoutExerciseId: string | string[];
  }>();
  const workoutExerciseId = getRouteParamId(rawId);

  const [selectedTab, setSelectedTab] = useState<ExerciseDetailTab>('track');
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [timerIndicatorTick, setTimerIndicatorTick] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const { item, isLoading } = useActiveWorkoutExerciseDetail(workoutExerciseId);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimerIndicatorTick(tick => tick + 1);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

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

  const isRestTimerRunning =
    timerRef.isRunning &&
    timerRef.endTime !== null &&
    timerRef.endTime > Date.now() &&
    timerIndicatorTick >= 0;

  if (workoutExerciseId && isLoading) {
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

          <Button
            variant="ghost"
            size="icon"
            onPress={() => setIsRestTimerOpen(true)}
          >
            <Icon icon={TimerIcon} size={20} className="text-foreground" />
            {isRestTimerRunning ? (
              <View className="bg-primary absolute top-0 right-0 h-2 w-2 rounded-full" />
            ) : null}
          </Button>
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
          <ExerciseTrackTab item={item} />
        </View>
        <View className="w-screen flex-1">
          <ExerciseHistoryTab exerciseId={item.workoutExercise.exerciseId} />
        </View>
      </StyledScrollView>

      <RestTimerSheet
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
      />
    </Screen>
  );
}

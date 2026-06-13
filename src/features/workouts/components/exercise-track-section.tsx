import {
  useExerciseTrackActions,
  useExerciseTrackTab
} from '@/src/features/workouts/hooks';
import type { Set } from '@/src/db/schema';
import { useEffect, useRef } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import { ProgressionSuggestion } from '@/src/features/workouts/components/progression-suggestion';
import { SetForm } from '@/src/features/workouts/components/set-form';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/types';

interface ExerciseTrackTabProps {
  item: WorkoutExerciseWithSets;
  onVerticalScrollStart?: () => void;
  onVerticalScrollEnd?: () => void;
}

export function ExerciseTrackSection({
  item,
  onVerticalScrollStart,
  onVerticalScrollEnd
}: ExerciseTrackTabProps) {
  const {
    trackingType,
    progressionSuggestion,
    historyPreview,
    latestHistorySets,
    refreshHistory
  } = useExerciseTrackTab(item);

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      scrollToBottom
    );

    return () => show.remove();
  }, []);

  const {
    addSet: _handleAddSet,
    updateSet: _handleUpdateSet,
    deleteSet: _handleDeleteSet
  } = useExerciseTrackActions({
    item,
    editingSetId: null,
    setEditingSetId: () => undefined
  });

  const handleAddSet = async (
    data: Parameters<typeof _handleAddSet>[0]
  ): Promise<Set> => {
    const createdSet = await Promise.resolve(_handleAddSet(data));

    scrollToBottom();
    await refreshHistory();

    return createdSet;
  };

  const handleUpdateSet = async (
    data: Parameters<typeof _handleUpdateSet>[0]
  ): Promise<Set | undefined> => {
    const updatedSet = await Promise.resolve(_handleUpdateSet(data));

    scrollToBottom();
    await refreshHistory();

    return updatedSet;
  };

  const handleDeleteSet = async (
    setId: Parameters<typeof _handleDeleteSet>[0]
  ) => {
    await Promise.resolve(_handleDeleteSet(setId));
    await refreshHistory();
  };

  return (
    <View className="w-full flex-1">
      <ProgressionSuggestion
        workoutExerciseId={item.workoutExercise.id}
        historyPreview={historyPreview}
        suggestion={progressionSuggestion}
      />
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={onVerticalScrollStart}
        onScrollEndDrag={onVerticalScrollEnd}
        onMomentumScrollEnd={onVerticalScrollEnd}
      >
        <SetForm
          trackingType={trackingType}
          sets={item.sets}
          previousSets={latestHistorySets}
          onAddSet={handleAddSet}
          onUpdateSet={handleUpdateSet}
          onDeleteSet={handleDeleteSet}
        />
      </ScrollView>
    </View>
  );
}

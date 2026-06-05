import {
  useExerciseTrackActions,
  useExerciseTrackTab
} from '@/src/features/workouts/hooks';
import { useEffect, useRef } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import { ProgressionSuggestion } from './progression-suggestion';
import { SetForm } from './set-form';
import type { WorkoutExerciseWithSets } from './types';

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
    latestHistorySets
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
    deleteSet: handleDeleteSet
  } = useExerciseTrackActions({
    item,
    editingSetId: null,
    setEditingSetId: () => undefined
  });

  const handleAddSet: typeof _handleAddSet = data => {
    _handleAddSet(data);
    scrollToBottom();
  };

  const handleUpdateSet: typeof _handleUpdateSet = data => {
    _handleUpdateSet(data);
    scrollToBottom();
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

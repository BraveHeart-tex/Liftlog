import {
  useExerciseTrackActions,
  useExerciseTrackTab
} from '@/src/features/workouts/hooks';
import type { Set } from '@/src/db/schema';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  View,
  type KeyboardEvent,
  type LayoutRectangle
} from 'react-native';
import { ProgressionSuggestion } from '@/src/features/workouts/components/progression-suggestion';
import { SetForm } from '@/src/features/workouts/components/set-form';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/types';

interface ExerciseTrackTabProps {
  item: WorkoutExerciseWithSets;
  historyBeforeStartedAt?: number;
  mode?: 'active' | 'historical';
  onVerticalScrollStart?: () => void;
  onVerticalScrollEnd?: () => void;
}

export function ExerciseTrackSection({
  item,
  historyBeforeStartedAt,
  mode = 'active',
  onVerticalScrollStart,
  onVerticalScrollEnd
}: ExerciseTrackTabProps) {
  const {
    trackingType,
    progressionSuggestion,
    historyPreview,
    latestHistorySets,
    refreshHistory
  } = useExerciseTrackTab(item, historyBeforeStartedAt);

  const scrollViewRef = useRef<ScrollView>(null);
  const focusedRowKeyRef = useRef<string | null>(null);
  const rowLayoutsRef = useRef(new Map<string, LayoutRectangle>());
  const [keyboardInset, setKeyboardInset] = useState(0);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const scrollToFocusedRow = useCallback(() => {
    const focusedRowKey = focusedRowKeyRef.current;

    if (!focusedRowKey) {
      return;
    }

    const rowLayout = rowLayoutsRef.current.get(focusedRowKey);

    if (!rowLayout) {
      return;
    }

    scrollViewRef.current?.scrollTo({
      animated: true,
      y: Math.max(0, rowLayout.y - 12)
    });
  }, []);

  const scheduleScrollToFocusedRow = useCallback(() => {
    setTimeout(scrollToFocusedRow, 100);
  }, [scrollToFocusedRow]);

  useEffect(() => {
    const handleKeyboardShow = (event: KeyboardEvent) => {
      setKeyboardInset(event.endCoordinates.height);
      scheduleScrollToFocusedRow();
    };

    const handleKeyboardHide = () => {
      setKeyboardInset(0);
    };

    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      handleKeyboardShow
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      handleKeyboardHide
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, [scheduleScrollToFocusedRow]);

  const handleRowFocus = useCallback(
    (rowKey: string) => {
      focusedRowKeyRef.current = rowKey;
      scheduleScrollToFocusedRow();
    },
    [scheduleScrollToFocusedRow]
  );

  const handleRowLayout = useCallback(
    (rowKey: string, layout: LayoutRectangle) => {
      rowLayoutsRef.current.set(rowKey, layout);
    },
    []
  );

  const {
    addSet: _handleAddSet,
    updateSet: _handleUpdateSet,
    deleteSet: _handleDeleteSet
  } = useExerciseTrackActions({
    item,
    editingSetId: null,
    setEditingSetId: () => undefined,
    completedAt: historyBeforeStartedAt,
    enableFeedback: mode === 'active',
    rebuildProgressOnChange: mode === 'active'
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
        contentContainerStyle={{ paddingBottom: keyboardInset + 32 }}
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
          onRowFocus={handleRowFocus}
          onRowLayout={handleRowLayout}
          onAddSet={handleAddSet}
          onUpdateSet={handleUpdateSet}
          onDeleteSet={handleDeleteSet}
        />
      </ScrollView>
    </View>
  );
}

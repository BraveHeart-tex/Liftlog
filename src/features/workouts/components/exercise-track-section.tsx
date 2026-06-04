import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import {
  useExerciseTrackActions,
  useExerciseTrackTab
} from '@/src/features/workouts/hooks';
import { iconSizes } from '@/src/theme/sizes';
import { Link } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import { ProgressionSuggestion } from './progression-suggestion';
import type { ProgressionSuggestionData } from './progression-suggestion-utils';
import { SetEntryRow } from './set-entry-row';
import { SetForm } from './set-form';
import type { SetValues, WorkoutExerciseWithSets } from './types';

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
    editingSetId,
    editingSet,
    setEditingSetId,
    prSetIds,
    trackingType,
    progressionSuggestion,
    historyPreview
  } = useExerciseTrackTab(item);
  const [prefillValues, setPrefillValues] = useState<
    (SetValues & { requestId: number }) | undefined
  >();

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
  } = useExerciseTrackActions({ item, editingSetId, setEditingSetId });

  const handleAddSet: typeof _handleAddSet = data => {
    _handleAddSet(data);
    scrollToBottom();
  };

  const handleUpdateSet: typeof _handleUpdateSet = data => {
    _handleUpdateSet(data);
    scrollToBottom();
  };

  const handleUseSuggestion = (suggestion: ProgressionSuggestionData) => {
    setEditingSetId(null);
    setPrefillValues(currentValue => ({
      weightKg: suggestion.suggestedWeightKg,
      reps: suggestion.suggestedReps,
      requestId: (currentValue?.requestId ?? 0) + 1
    }));
  };

  return (
    <View className="w-full flex-1">
      <ProgressionSuggestion
        suggestion={progressionSuggestion}
        onUseSuggestion={handleUseSuggestion}
      />
      <SetForm
        trackingType={trackingType}
        editingSet={editingSet}
        prefillValues={prefillValues}
        onAddSet={handleAddSet}
        onUpdateSet={handleUpdateSet}
        onClear={() => setEditingSetId(null)}
        onDeleteSet={handleDeleteSet}
      />
      <View className="border-border mt-4 border-t" />
      <View className="mt-4 flex-1">
        <View className="flex flex-row items-center justify-between">
          <Text variant="overline" tone="muted">
            Sets
          </Text>
          {!!historyPreview && item.exercise?.id && (
            <Link
              href={{
                pathname:
                  '/(tabs)/workout/exercise/[workoutExerciseId]/history',
                params: { workoutExerciseId: item.workoutExercise.id }
              }}
            >
              <View className="flex flex-row items-center gap-0.5">
                <Text className="text-primary" variant="small">
                  History
                </Text>
                <Icon
                  icon={ChevronRightIcon}
                  className="text-primary"
                  size={iconSizes.sm}
                />
              </View>
            </Link>
          )}
        </View>
        {item.sets.length > 0 ? (
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
            <View className="mt-2">
              {item.sets.map((set, index) => (
                <SetEntryRow
                  key={set.id}
                  set={set}
                  setNumber={index + 1}
                  isPR={prSetIds.has(set.id)}
                  isEditing={set.id === editingSetId}
                  trackingType={trackingType}
                  onEdit={() =>
                    setEditingSetId(prev => (prev === set.id ? null : set.id))
                  }
                />
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text variant="small" tone="muted" className="mt-2">
            No sets logged yet.
          </Text>
        )}
      </View>
    </View>
  );
}

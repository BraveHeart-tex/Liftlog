import { StyledBottomSheetFlatList } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { ExerciseCategoryFilters } from '@/src/features/exercises/components/exercise-category-filters';
import type { CategoryFilter } from '@/src/features/exercises/constants';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { ExercisePickerRow } from '@/src/features/workouts/components/exercise-picker-row';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExercisePickerSheetProps {
  isOpen: boolean;
  exercises: ExerciseListItem[];
  selectedExerciseIds: ExerciseListItem['id'][];
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseListItem) => void;
  onCreateCustomExercise: () => void;
}

const SNAP_POINTS = ['70%', '90%'];

export function ExercisePickerSheet({
  isOpen,
  exercises,
  selectedExerciseIds,
  onClose,
  onSelectExercise,
  onCreateCustomExercise
}: ExercisePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  const customExerciseCount = useMemo(
    () => exercises.filter(exercise => exercise.isCustom === 1).length,
    [exercises]
  );

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const selectedExerciseIdSet = new Set(selectedExerciseIds);

    return exercises.filter(exercise => {
      const isAlreadySelected = selectedExerciseIdSet.has(exercise.id);
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'custom'
          ? exercise.isCustom === 1
          : exercise.category === selectedCategory);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        exercise.name.toLocaleLowerCase().includes(normalizedQuery);

      return !isAlreadySelected && matchesCategory && matchesQuery;
    });
  }, [exercises, query, selectedCategory, selectedExerciseIds]);

  const emptyTitle =
    selectedCategory === 'custom'
      ? query.trim().length > 0
        ? 'No custom exercises found'
        : 'No custom exercises yet'
      : 'No exercises found';

  const emptyDescription =
    selectedCategory === 'custom'
      ? query.trim().length > 0
        ? 'Try a different search or switch to All.'
        : 'Custom exercises you create will show here.'
      : 'Try a different search.';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={SNAP_POINTS}
      footer={
        <View
          style={{ paddingBottom: insets.bottom }}
          className="border-border bg-card border-t px-4 pt-3"
        >
          <Button variant="secondary" onPress={onCreateCustomExercise}>
            Create custom exercise
          </Button>
        </View>
      }
    >
      <BottomSheetHeader>
        <BottomSheetTitle>Add exercise</BottomSheetTitle>
        <BottomSheetDescription>
          Choose an exercise for this workout.
        </BottomSheetDescription>
      </BottomSheetHeader>

      <View className="px-4 pb-3">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        <ExerciseCategoryFilters
          selectedCategory={selectedCategory}
          setSelectedCategory={category => {
            Keyboard.dismiss();
            setSelectedCategory(category);
          }}
          shouldShowCustomExerciseFilter={customExerciseCount > 0}
        />
      </View>

      <StyledBottomSheetFlatList
        data={filteredExercises}
        keyExtractor={(item: ExerciseListItem) => item.id}
        contentContainerClassName="px-4 pb-32"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        onTouchStart={Keyboard.dismiss}
        renderItem={({ item }: { item: ExerciseListItem }) => (
          <ExercisePickerRow exercise={item} onPress={onSelectExercise} />
        )}
        ListEmptyComponent={
          <View className="border-border bg-card mt-3 items-center justify-center rounded-lg border border-dashed px-6 py-10">
            <Text variant="h3" className="text-center">
              {emptyTitle}
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              {emptyDescription}
            </Text>
          </View>
        }
      />
    </BottomSheet>
  );
}

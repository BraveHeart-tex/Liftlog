import { StyledBottomSheetFlatList } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import type { Exercise } from '@/src/db/schema';
import { useMemo, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { getCategoryLabel } from './utils';

type ExercisePickerSheetProps = {
  isOpen: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
};

export function ExercisePickerSheet({
  isOpen,
  exercises,
  onClose,
  onSelectExercise
}: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('');

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery.length === 0) {
      return exercises;
    }

    return exercises.filter(exercise =>
      exercise.name.toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [exercises, query]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['70%', '90%']}>
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
      </View>

      <StyledBottomSheetFlatList
        data={filteredExercises}
        keyExtractor={(item: Exercise) => item.id}
        contentContainerClassName="px-4 pb-8"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        onTouchStart={Keyboard.dismiss}
        renderItem={({ item }: { item: Exercise }) => (
          <Pressable
            onPress={() => onSelectExercise(item)}
            className="border-border bg-card mt-3 rounded-lg border p-4"
          >
            <Text variant="bodyMedium">{item.name}</Text>
            <Text variant="small" tone="muted" className="mt-1">
              {getCategoryLabel(item.category)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="border-border bg-card mt-3 items-center justify-center rounded-lg border border-dashed px-6 py-10">
            <Text variant="h3" className="text-center">
              No exercises found
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Try a different search.
            </Text>
          </View>
        }
      />
    </BottomSheet>
  );
}

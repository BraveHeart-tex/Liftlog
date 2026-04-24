import { StyledBottomSheetFlatList } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { cn } from '@/src/lib/utils/cn';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { getCategoryLabel } from './utils';

interface ExercisePickerSheetProps {
  isOpen: boolean;
  exercises: ExerciseListItem[];
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseListItem) => void;
}

const SNAP_POINTS = ['70%', '90%'];
const SOURCE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Custom', value: 'custom' }
] as const;

type ExerciseSourceFilter = (typeof SOURCE_FILTERS)[number]['value'];

export function ExercisePickerSheet({
  isOpen,
  exercises,
  onClose,
  onSelectExercise
}: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<ExerciseSourceFilter>('all');
  const customExerciseCount = useMemo(
    () => exercises.filter(exercise => exercise.isCustom === 1).length,
    [exercises]
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return exercises.filter(exercise => {
      const matchesSource = sourceFilter === 'all' || exercise.isCustom === 1;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        exercise.name.toLocaleLowerCase().includes(normalizedQuery);

      return matchesSource && matchesQuery;
    });
  }, [exercises, query, sourceFilter]);

  const emptyTitle =
    sourceFilter === 'custom'
      ? query.trim().length > 0
        ? 'No custom exercises found'
        : 'No custom exercises yet'
      : 'No exercises found';
  const emptyDescription =
    sourceFilter === 'custom'
      ? query.trim().length > 0
        ? 'Try a different search or switch to All.'
        : 'Custom exercises you create will show here.'
      : 'Try a different search.';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={SNAP_POINTS}>
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

        <View className="mt-3 flex-row gap-2">
          {SOURCE_FILTERS.map(filter => {
            const isSelected = sourceFilter === filter.value;
            const label =
              filter.value === 'custom'
                ? `${filter.label} (${customExerciseCount})`
                : filter.label;

            return (
              <Pressable
                key={filter.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  Keyboard.dismiss();
                  setSourceFilter(filter.value);
                }}
                className={cn(
                  'border-border min-h-11 flex-1 items-center justify-center rounded-lg border px-4 py-3',
                  isSelected ? 'bg-primary' : 'bg-card'
                )}
              >
                <Text
                  variant="small"
                  className={cn(
                    isSelected
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <StyledBottomSheetFlatList
        data={filteredExercises}
        keyExtractor={(item: ExerciseListItem) => item.id}
        contentContainerClassName="px-4 pb-8"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        onTouchStart={Keyboard.dismiss}
        renderItem={({ item }: { item: ExerciseListItem }) => (
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

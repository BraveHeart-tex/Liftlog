import { StyledFlatList } from '@/src/components/styled/flat-list';
import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { CreateExerciseSheet } from '@/src/features/exercises/components/create-exercise-sheet';
import {
  CATEGORY_FILTERS,
  type CategoryFilter
} from '@/src/features/exercises/constants';
import { useExercises } from '@/src/features/exercises/hooks';
import { cn } from '@/src/lib/utils/cn';
import { getPrimaryMuscleLabel } from '@/src/lib/utils/muscle';
import { toTitleCase } from '@/src/lib/utils/string';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

export default function ExercisesScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const exercises = useExercises();

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return exercises.filter(exercise => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        exercise.name.toLocaleLowerCase().includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === 'all' ||
        exercise.category.toLocaleLowerCase() === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [exercises, query, selectedCategory]);

  return (
    <Screen withPadding={false}>
      <View className="px-4 pt-6">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text variant="h1">Exercises</Text>
            <Text variant="small" tone="muted" className="mt-2">
              Browse and search your exercise library
            </Text>
          </View>

          <Button
            variant="secondary"
            size="sm"
            onPress={() => setIsCreateSheetOpen(true)}
          >
            Add
          </Button>
        </View>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className="mt-4 mb-2"
        />
      </View>

      {/* keyboardShouldPersistTaps="handled" on FlatList handles this */}
      <StyledFlatList
        data={filteredExercises}
        keyExtractor={item => item.id}
        className="flex-1"
        contentContainerClassName="px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <StyledScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
              contentContainerClassName="gap-2 pr-4"
            >
              {CATEGORY_FILTERS.map(category => {
                const isSelected = category.value === selectedCategory;

                return (
                  <Pressable
                    key={category.value}
                    onPress={() => setSelectedCategory(category.value)}
                    className={cn(
                      'border-border rounded-full border px-4 py-3',
                      isSelected ? 'bg-card' : 'bg-background'
                    )}
                  >
                    <Text
                      variant="small"
                      className={cn(
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </StyledScrollView>

            <View className="mt-4">
              {filteredExercises.length > 0 && (
                <Text variant="caption" tone="muted">
                  {filteredExercises.length} exercises
                </Text>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/exercises/[id]',
                params: { id: item.id }
              })
            }
            className="border-border bg-card mt-3 rounded-lg border p-4"
          >
            <Text variant="bodyMedium">{item.name}</Text>
            <Text variant="small" tone="muted" className="mt-1">
              {toTitleCase(getPrimaryMuscleLabel(item.primaryMuscles))}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="border-border bg-card items-center justify-center rounded-lg border border-dashed px-6 py-10">
            <Text variant="h3" className="text-center">
              No exercises found
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Try a different search or category
            </Text>
          </View>
        }
      />

      <CreateExerciseSheet
        isOpen={isCreateSheetOpen}
        exercises={exercises}
        onClose={() => setIsCreateSheetOpen(false)}
      />
    </Screen>
  );
}

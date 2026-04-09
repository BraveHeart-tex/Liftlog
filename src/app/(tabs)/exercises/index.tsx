import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { type Exercise } from '@/src/db/schema';
import { useExercises } from '@/src/features/exercises/hooks';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORY_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Barbell', value: 'barbell' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Machine', value: 'machine' },
  { label: 'Cable', value: 'cable' },
  { label: 'Bodyweight', value: 'bodyweight' }
] as const;

type CategoryFilter = (typeof CATEGORY_FILTERS)[number]['value'];

function getPrimaryMuscleLabel(primaryMuscles: Exercise['primaryMuscles']) {
  try {
    const parsed = JSON.parse(primaryMuscles) as string[];
    return parsed[0] ?? 'Unspecified';
  } catch {
    return 'Unspecified';
  }
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ExercisesScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');

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
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <FlatList
        data={filteredExercises}
        keyExtractor={item => item.id}
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text variant="h1">Exercises</Text>
            <Text variant="small" tone="muted" className="mt-2">
              Browse and search your exercise library
            </Text>

            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search exercises"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              className="mt-4"
            />

            <ScrollView
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
                    className={
                      isSelected
                        ? 'border-border bg-card rounded-full border px-4 py-3'
                        : 'border-border bg-background rounded-full border px-4 py-3'
                    }
                  >
                    <Text
                      variant="small"
                      className={
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      }
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View className="mt-6">
              {filteredExercises.length > 0 && (
                <Text variant="caption" tone="muted">
                  {filteredExercises.length} exercises
                </Text>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable className="border-border bg-card mt-3 rounded-lg border p-4">
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
    </SafeAreaView>
  );
}

import { StyledFlatList } from '@/src/components/styled/flat-list';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Screen } from '@/src/components/ui/screen';
import { SearchInputIcon } from '@/src/components/ui/search-input-icon';
import { Text } from '@/src/components/ui/text';
import { ExerciseCategoryFilters } from '@/src/features/exercises/components/exercise-category-filters';
import { ExerciseListRow } from '@/src/features/exercises/components/exercise-list-row';
import { useExercisesScreen } from '@/src/features/exercises/hooks';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function ExercisesScreen() {
  const {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    filteredExercises,
    hasCustomExercise
  } = useExercisesScreen();

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
            onPress={() => router.push('/exercises/new')}
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
          leftIcon={<SearchInputIcon />}
        />
      </View>

      <StyledFlatList
        data={filteredExercises}
        keyExtractor={item => item.id}
        className="flex-1"
        contentContainerClassName="px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ExerciseCategoryFilters
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              shouldShowCustomExerciseFilter={hasCustomExercise}
            />

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
          <ExerciseListRow
            exercise={item}
            onPress={exercise =>
              router.push({
                pathname: '/(tabs)/exercises/[id]',
                params: { id: exercise.id }
              })
            }
          />
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
    </Screen>
  );
}

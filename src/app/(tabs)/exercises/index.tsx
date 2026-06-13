import { StyledFlatList } from '@/src/components/styled/flat-list';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Input } from '@/src/components/ui/input';
import { Screen } from '@/src/components/ui/screen';
import { SearchInputIcon } from '@/src/components/ui/search-input-icon';
import { Text } from '@/src/components/ui/text';
import { ExerciseListRow } from '@/src/features/exercises/components/exercise-list-row';
import type { ExerciseListDataItem } from '@/src/features/exercises/display';
import { useExercisesScreen } from '@/src/features/exercises/hooks';
import { ExercisePickerFilters } from '@/src/features/workouts/components/exercise-picker-filters';
import { iconSizes } from '@/src/theme/sizes';
import { router } from 'expo-router';
import { PlusIcon, SearchXIcon } from 'lucide-react-native';
import { useCallback } from 'react';
import { View } from 'react-native';

export default function ExercisesScreen() {
  const {
    query,
    setQuery,
    selectedFilter,
    setSelectedFilter,
    filteredExercises,
    exerciseListItems,
    hasCustomExercise
  } = useExercisesScreen();

  const trimmedQuery = query.trim();
  const hasActiveSearchOrFilter =
    trimmedQuery.length > 0 || selectedFilter !== 'all';
  const emptyDescription =
    trimmedQuery.length > 0
      ? `We couldn't find anything matching "${trimmedQuery}". Try adjusting your search or add it yourself.`
      : selectedFilter !== 'all'
        ? "We couldn't find anything in this category. Try a different filter or add it yourself."
        : 'Your exercise library is empty. Create a custom exercise to get started.';

  const keyExtractor = useCallback(
    (item: ExerciseListDataItem) =>
      item.type === 'section-header' ? item.id : item.exercise.id,
    []
  );

  const renderItem = useCallback(({ item }: { item: ExerciseListDataItem }) => {
    if (item.type === 'section-header') {
      return (
        <View className="pt-5 pb-1">
          <Text
            variant="small"
            tone="muted"
            className="font-semibold tracking-widest uppercase"
          >
            {item.title}
          </Text>
        </View>
      );
    }

    return (
      <ExerciseListRow
        exercise={item.exercise}
        onPress={exercise =>
          router.push({
            pathname: '/exercises/[id]',
            params: { id: exercise.id }
          })
        }
      />
    );
  }, []);

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
            <Icon icon={PlusIcon} className="text-secondary-foreground" />
          </Button>
        </View>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          containerClassName="mt-4 py-0"
          leftIcon={<SearchInputIcon />}
        />
      </View>

      <StyledFlatList
        data={exerciseListItems}
        keyExtractor={keyExtractor}
        className="flex-1"
        contentContainerClassName="px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ExercisePickerFilters
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
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
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center px-2 pt-16 pb-10">
            <View className="border-border/60 bg-card h-28 w-28 items-center justify-center rounded-full border">
              <View className="bg-muted h-20 w-20 items-center justify-center rounded-full">
                <Icon
                  icon={SearchXIcon}
                  size={28}
                  className="text-muted-foreground"
                />
              </View>
            </View>

            <Text variant="h2" className="mt-8 text-center">
              No exercises found
            </Text>
            <Text
              variant="body"
              tone="muted"
              className="mt-4 max-w-80 text-center"
            >
              {emptyDescription}
            </Text>

            <View className="mt-10 w-full gap-4">
              <Button
                size="md"
                className="w-full"
                onPress={() => {
                  router.push('/exercises/new');
                  setQuery('');
                  setSelectedFilter('all');
                }}
                leftIcon={
                  <Icon
                    icon={PlusIcon}
                    size={iconSizes.md}
                    className="text-primary-foreground"
                  />
                }
              >
                Create Custom Exercise
              </Button>

              {hasActiveSearchOrFilter ? (
                <Button
                  variant="ghost"
                  className="w-full"
                  onPress={() => {
                    setQuery('');
                    setSelectedFilter('all');
                  }}
                >
                  Clear Search
                </Button>
              ) : null}
            </View>
          </View>
        }
      />
    </Screen>
  );
}

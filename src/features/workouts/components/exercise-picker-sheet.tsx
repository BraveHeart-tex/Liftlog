import { StyledBottomSheetFlatList } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Input } from '@/src/components/ui/input';
import { SearchInputIcon } from '@/src/components/ui/search-input-icon';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import {
  ExercisePickerFilters,
  type ExercisePickerFilter
} from '@/src/features/workouts/components/exercise-picker-filters';
import { ExercisePickerRow } from '@/src/features/workouts/components/exercise-picker-row';
import { getCategoryLabel } from '@/src/features/workouts/components/utils';
import { XIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExercisePickerSheetProps {
  isOpen: boolean;
  exercises: ExerciseListItem[];
  recentExerciseIds: ExerciseListItem['id'][];
  selectedExerciseIds: ExerciseListItem['id'][];
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseListItem) => void;
  onCreateCustomExercise: (initialName?: string) => void;
}

type SectionHeaderItem = {
  type: 'section-header';
  id: string;
  title: string;
};

type ExerciseRowItem = {
  type: 'exercise';
  exercise: ExerciseListItem;
};

type ListItem = SectionHeaderItem | ExerciseRowItem;

const SNAP_POINTS = ['90%'];
const RECENTLY_USED_SECTION_ID = 'section-recently-used';

function exerciseMatchesSearch(
  exercise: ExerciseListItem,
  normalizedQuery: string
) {
  if (normalizedQuery.length === 0) {
    return true;
  }

  const searchableValues = [
    exercise.name,
    exercise.category,
    getCategoryLabel(exercise.category),
    ...(exercise.isCustom === 1 ? ['custom'] : [])
  ];

  return searchableValues.some(value =>
    value.toLocaleLowerCase().includes(normalizedQuery)
  );
}

function exerciseMatchesFilter(
  exercise: ExerciseListItem,
  selectedFilter: ExercisePickerFilter,
  recentExerciseIdSet: Set<ExerciseListItem['id']>
) {
  if (selectedFilter === 'all') {
    return true;
  }

  if (selectedFilter === 'recent') {
    return recentExerciseIdSet.has(exercise.id);
  }

  if (selectedFilter === 'custom') {
    return exercise.isCustom === 1;
  }

  return exercise.category === selectedFilter;
}

export function ExercisePickerSheet({
  isOpen,
  exercises,
  recentExerciseIds,
  selectedExerciseIds,
  onClose,
  onSelectExercise,
  onCreateCustomExercise
}: ExercisePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<ExercisePickerFilter>('all');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedFilter('all');
    }
  }, [isOpen]);

  const trimmedQuery = query.trim();

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedExerciseIdSet = new Set(selectedExerciseIds);
    const recentExerciseIdSet = new Set(recentExerciseIds);
    const recentExerciseOrderById = new Map(
      recentExerciseIds.map((exerciseId, index) => [exerciseId, index])
    );

    const matches = exercises.filter(exercise => {
      return (
        !selectedExerciseIdSet.has(exercise.id) &&
        exerciseMatchesFilter(exercise, selectedFilter, recentExerciseIdSet) &&
        exerciseMatchesSearch(exercise, normalizedQuery)
      );
    });

    if (selectedFilter !== 'recent') {
      return matches;
    }

    return matches.sort(
      (a, b) =>
        (recentExerciseOrderById.get(a.id) ?? 0) -
        (recentExerciseOrderById.get(b.id) ?? 0)
    );
  }, [
    exercises,
    query,
    recentExerciseIds,
    selectedExerciseIds,
    selectedFilter
  ]);

  const hasHiddenSelectedMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedExerciseIdSet = new Set(selectedExerciseIds);
    const recentExerciseIdSet = new Set(recentExerciseIds);

    return exercises.some(
      exercise =>
        selectedExerciseIdSet.has(exercise.id) &&
        exerciseMatchesFilter(exercise, selectedFilter, recentExerciseIdSet) &&
        exerciseMatchesSearch(exercise, normalizedQuery)
    );
  }, [
    exercises,
    query,
    recentExerciseIds,
    selectedExerciseIds,
    selectedFilter
  ]);

  const listData = useMemo<ListItem[]>(() => {
    const recentExerciseIdSet = new Set(recentExerciseIds);
    const showSections = selectedFilter === 'all' && trimmedQuery.length === 0;

    if (!showSections) {
      return filteredExercises.map(
        exercise => ({ type: 'exercise', exercise }) satisfies ExerciseRowItem
      );
    }

    const recentExercises = filteredExercises.filter(ex =>
      recentExerciseIdSet.has(ex.id)
    );
    const otherExercises = filteredExercises.filter(
      ex => !recentExerciseIdSet.has(ex.id)
    );

    const items: ListItem[] = [];

    if (recentExercises.length > 0) {
      items.push({
        type: 'section-header',
        id: RECENTLY_USED_SECTION_ID,
        title: 'Recently Used'
      });
      recentExercises.forEach(exercise => {
        items.push({ type: 'exercise', exercise });
      });
    }

    let currentLetter = '';

    otherExercises.forEach(exercise => {
      const letter = exercise.name.trim().charAt(0).toUpperCase();

      if (letter !== currentLetter) {
        currentLetter = letter;
        items.push({
          type: 'section-header',
          id: `section-${letter}`,
          title: letter
        });
      }

      items.push({ type: 'exercise', exercise });
    });

    return items;
  }, [filteredExercises, recentExerciseIds, selectedFilter, trimmedQuery]);

  const emptyTitle = (() => {
    if (trimmedQuery.length > 0) {
      return 'No exercises found';
    }

    if (selectedFilter === 'custom') {
      return 'No custom exercises yet';
    }

    if (selectedFilter === 'recent') {
      return 'No recent exercises yet';
    }

    return 'No exercises found';
  })();

  const emptyDescription = (() => {
    if (hasHiddenSelectedMatches) {
      return 'Matching exercises may already be in this workout.';
    }

    if (trimmedQuery.length > 0) {
      return `Create "${trimmedQuery}" or try a different search.`;
    }

    if (selectedFilter === 'custom') {
      return 'Custom exercises you create will show here.';
    }

    if (selectedFilter === 'recent') {
      return 'Finish a workout and your recently used exercises will show here.';
    }

    return 'Try a different filter or search.';
  })();

  const createButtonLabel =
    trimmedQuery.length > 0
      ? `Create "${trimmedQuery}"`
      : 'Create custom exercise';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={SNAP_POINTS}
      activeOffsetY={[-12, 12]}
      footer={
        <View
          style={{ paddingBottom: insets.bottom }}
          className="border-border bg-card border-t px-4 pt-3"
        >
          <Button
            variant="secondary"
            onPress={() => onCreateCustomExercise(trimmedQuery)}
          >
            {createButtonLabel}
          </Button>
        </View>
      }
    >
      <BottomSheetHeader>
        <View className="flex w-full flex-row items-center justify-between">
          <BottomSheetTitle>Add exercise</BottomSheetTitle>
          <Button
            variant="secondary"
            size="icon"
            onPress={onClose}
            accessibilityLabel="Close exercise picker sheet"
          >
            <Icon icon={XIcon} size="lg" className="text-foreground" />
          </Button>
        </View>
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
          leftIcon={<SearchInputIcon />}
          containerClassName="py-0"
        />
        <ExercisePickerFilters
          selectedFilter={selectedFilter}
          setSelectedFilter={filter => {
            Keyboard.dismiss();
            setSelectedFilter(filter);
          }}
        />
      </View>

      <StyledBottomSheetFlatList
        data={listData}
        keyExtractor={(item: ListItem) =>
          item.type === 'section-header' ? item.id : item.exercise.id
        }
        contentContainerClassName="px-4 pb-32"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        onTouchStart={Keyboard.dismiss}
        renderItem={({ item }: { item: ListItem }) => {
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
            <ExercisePickerRow
              exercise={item.exercise}
              isSelected={selectedExerciseIds.includes(item.exercise.id)}
              onPress={onSelectExercise}
            />
          );
        }}
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

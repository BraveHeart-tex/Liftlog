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
import {
  buildAlphabetizedExerciseListItems,
  matchesExerciseSearch,
  type ExerciseListDataItem,
  type ExerciseListRowItem,
  type ExerciseListSectionHeaderItem
} from '@/src/features/exercises/display';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import {
  ExercisePickerFilters,
  type ExercisePickerFilter
} from '@/src/features/workouts/components/exercise-picker-filters';
import { ExercisePickerRow } from '@/src/features/workouts/components/exercise-picker-row';
import { XIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExercisePickerSheetCommonProps {
  isOpen: boolean;
  exercises: ExerciseListItem[];
  recentExerciseIds?: ExerciseListItem['id'][];
  selectedExerciseIds: ExerciseListItem['id'][];
  onClose: () => void;
  onCreateCustomExercise: (initialName?: string) => void;
}

type ExercisePickerSheetProps = ExercisePickerSheetCommonProps &
  (
    | {
        mode?: 'single';
        onSelectExercise: (exercise: ExerciseListItem) => void;
      }
    | {
        mode: 'multiple';
        onSelectExercises: (exercises: ExerciseListItem[]) => void;
      }
  );

const SNAP_POINTS = ['90%'];
const RECENTLY_USED_SECTION_ID = 'section-recently-used';

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
  recentExerciseIds = [],
  selectedExerciseIds,
  onClose,
  onCreateCustomExercise,
  ...selectionProps
}: ExercisePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<ExercisePickerFilter>('all');
  const [pendingExercises, setPendingExercises] = useState<ExerciseListItem[]>(
    []
  );
  const isMultiple = selectionProps.mode === 'multiple';
  const shouldShowCustomExerciseFilter = exercises.some(
    exercise => exercise.isCustom === 1
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedFilter('all');
      setPendingExercises([]);
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
        matchesExerciseSearch(exercise, normalizedQuery)
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
        matchesExerciseSearch(exercise, normalizedQuery)
    );
  }, [
    exercises,
    query,
    recentExerciseIds,
    selectedExerciseIds,
    selectedFilter
  ]);

  const listData = useMemo<ExerciseListDataItem[]>(() => {
    if (selectedFilter === 'recent') {
      return filteredExercises.map(
        exercise =>
          ({ type: 'exercise', exercise }) satisfies ExerciseListRowItem
      );
    }

    if (selectedFilter !== 'all' || trimmedQuery.length > 0) {
      return buildAlphabetizedExerciseListItems(filteredExercises);
    }

    const recentExerciseIdSet = new Set(recentExerciseIds);
    const recentExercises = filteredExercises.filter(exercise =>
      recentExerciseIdSet.has(exercise.id)
    );
    const otherExercises = filteredExercises.filter(
      exercise => !recentExerciseIdSet.has(exercise.id)
    );
    const items: ExerciseListDataItem[] = [];

    if (recentExercises.length > 0) {
      items.push({
        type: 'section-header',
        id: RECENTLY_USED_SECTION_ID,
        title: 'Recently Used'
      } satisfies ExerciseListSectionHeaderItem);
      recentExercises.forEach(exercise => {
        items.push({ type: 'exercise', exercise });
      });
    }

    return [...items, ...buildAlphabetizedExerciseListItems(otherExercises)];
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
  const addButtonLabel = `Add ${pendingExercises.length} ${
    pendingExercises.length === 1 ? 'exercise' : 'exercises'
  }`;

  const selectExercise = (exercise: ExerciseListItem) => {
    if (selectionProps.mode !== 'multiple') {
      selectionProps.onSelectExercise(exercise);

      return;
    }

    setPendingExercises(currentExercises => {
      if (
        currentExercises.some(
          currentExercise => currentExercise.id === exercise.id
        )
      ) {
        return currentExercises.filter(
          currentExercise => currentExercise.id !== exercise.id
        );
      }

      return [...currentExercises, exercise];
    });
  };

  const addPendingExercises = () => {
    if (selectionProps.mode !== 'multiple' || pendingExercises.length === 0) {
      return;
    }

    selectionProps.onSelectExercises(pendingExercises);
    onClose();
  };

  const createCustomExercise = () => {
    if (selectionProps.mode === 'multiple' && pendingExercises.length > 0) {
      selectionProps.onSelectExercises(pendingExercises);
    }

    onCreateCustomExercise(trimmedQuery);
  };

  const keyExtractor = useCallback(
    (item: ExerciseListDataItem) =>
      item.type === 'section-header' ? item.id : item.exercise.id,
    []
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={SNAP_POINTS}
      activeOffsetY={[-12, 12]}
      footer={
        <View
          style={{ paddingBottom: insets.bottom }}
          className="border-border bg-card gap-2 border-t px-4 pt-3"
        >
          <Button variant="secondary" onPress={createCustomExercise}>
            {createButtonLabel}
          </Button>
          {isMultiple && (
            <Button
              disabled={pendingExercises.length === 0}
              onPress={addPendingExercises}
            >
              {addButtonLabel}
            </Button>
          )}
        </View>
      }
    >
      <BottomSheetHeader>
        <View className="flex w-full flex-row items-center justify-between">
          <View>
            <BottomSheetTitle>
              {isMultiple ? 'Add exercises' : 'Add exercise'}
            </BottomSheetTitle>
            <BottomSheetDescription>
              {isMultiple
                ? 'Choose exercises to add to this template.'
                : 'Choose an exercise for this workout.'}
            </BottomSheetDescription>
          </View>
          <Button
            variant="secondary"
            size="icon"
            onPress={onClose}
            accessibilityLabel="Close exercise picker sheet"
          >
            <Icon icon={XIcon} size="lg" className="text-foreground" />
          </Button>
        </View>
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
          shouldShowCustomExerciseFilter={shouldShowCustomExerciseFilter}
        />
      </View>

      <StyledBottomSheetFlatList
        data={listData}
        keyExtractor={keyExtractor}
        contentContainerClassName={isMultiple ? 'px-4 pb-48' : 'px-4 pb-32'}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        onTouchStart={Keyboard.dismiss}
        renderItem={({ item }: { item: ExerciseListDataItem }) => {
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
              isSelected={pendingExercises.some(
                exercise => exercise.id === item.exercise.id
              )}
              onPress={selectExercise}
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

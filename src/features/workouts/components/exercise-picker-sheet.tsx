import { StyledBottomSheetFlatList } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { SearchInputIcon } from '@/src/components/ui/search-input-icon';
import { Text } from '@/src/components/ui/text';
import {
  buildAlphabetizedExerciseListItems,
  matchesExerciseSearch,
  type ExerciseListDataItem,
  type ExerciseListRowItem,
  type ExerciseListSectionHeaderItem
} from '@/src/features/exercises/exercise-display.utils';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import {
  ExercisePickerFilters,
  type ExercisePickerFilter
} from '@/src/features/workouts/components/exercise-picker-filters';
import { ExercisePickerRow } from '@/src/features/workouts/components/exercise-picker-row';
import { PlusIcon, XIcon } from 'lucide-react-native';
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Keyboard, Platform, View, type ListRenderItem } from 'react-native';

interface ExercisePickerSheetCommonProps {
  isOpen: boolean;
  exercises: ExerciseListItem[];
  isLoading?: boolean;
  recentExerciseIds?: ExerciseListItem['id'][];
  selectedExerciseIds: ExerciseListItem['id'][];
  onContentReadyChange?: (isReady: boolean) => void;
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

interface ExercisePickerSearchInputProps {
  isOpen: boolean;
  onChangeQuery: (query: string) => void;
  onCommitQuery: (query: string) => void;
}

const ExercisePickerSearchInput = memo(function ExercisePickerSearchInput({
  isOpen,
  onChangeQuery,
  onCommitQuery
}: ExercisePickerSearchInputProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    onCommitQuery(deferredQuery);
  }, [deferredQuery, onCommitQuery]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      onChangeQuery('');
    }
  }, [isOpen, onChangeQuery]);

  const handleChangeText = useCallback(
    (nextQuery: string) => {
      setQuery(nextQuery);
      onChangeQuery(nextQuery);
    },
    [onChangeQuery]
  );

  return (
    <BottomSheetInput
      value={query}
      onChangeText={handleChangeText}
      placeholder="Search exercises"
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
      leftIcon={<SearchInputIcon />}
      density="compact"
    />
  );
});

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

export function ExercisePickerSheet(props: ExercisePickerSheetProps) {
  const { isOpen, onClose } = props;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={SNAP_POINTS}
      activeOffsetY={[-12, 12]}
    >
      {({ isContentReady }) => (
        <ExercisePickerSheetBody
          isContentReady={isContentReady}
          sheetProps={props}
        />
      )}
    </BottomSheet>
  );
}

interface ExercisePickerSheetBodyProps {
  isContentReady: boolean;
  sheetProps: ExercisePickerSheetProps;
}

function ExercisePickerSheetBody({
  isContentReady,
  sheetProps
}: ExercisePickerSheetBodyProps) {
  const { isOpen, onContentReadyChange } = sheetProps;

  useEffect(() => {
    onContentReadyChange?.(isContentReady);
  }, [isContentReady, onContentReadyChange]);

  if (!isOpen) {
    return null;
  }

  return <ExercisePickerSheetContent {...sheetProps} />;
}

const ExercisePickerSheetContent = memo(function ExercisePickerSheetContent({
  isOpen,
  exercises,
  isLoading = false,
  recentExerciseIds = [],
  selectedExerciseIds,
  onContentReadyChange: _onContentReadyChange,
  onClose,
  onCreateCustomExercise,
  ...selectionProps
}: ExercisePickerSheetProps) {
  const latestQueryRef = useRef('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<ExercisePickerFilter>('all');
  const [pendingExercises, setPendingExercises] = useState<ExerciseListItem[]>(
    []
  );
  const isMultiple = selectionProps.mode === 'multiple';
  const onSelectExercise =
    selectionProps.mode === 'multiple'
      ? undefined
      : selectionProps.onSelectExercise;
  const onSelectExercises =
    selectionProps.mode === 'multiple'
      ? selectionProps.onSelectExercises
      : undefined;
  const pendingExerciseIdSet = useMemo(
    () => new Set(pendingExercises.map(exercise => exercise.id)),
    [pendingExercises]
  );
  const shouldShowCustomExerciseFilter = exercises.some(
    exercise => exercise.isCustom === 1
  );

  useEffect(() => {
    if (!isOpen) {
      latestQueryRef.current = '';
      setCommittedQuery('');
      setSelectedFilter('all');
      setPendingExercises([]);
    }
  }, [isOpen]);

  const handleQueryChange = useCallback((nextQuery: string) => {
    latestQueryRef.current = nextQuery;
  }, []);

  const trimmedQuery = committedQuery.trim();

  const filteredExercises = useMemo(() => {
    const normalizedQuery = committedQuery.trim().toLowerCase();
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
    committedQuery,
    exercises,
    recentExerciseIds,
    selectedExerciseIds,
    selectedFilter
  ]);

  const hasHiddenSelectedMatches = useMemo(() => {
    const normalizedQuery = committedQuery.trim().toLowerCase();
    const selectedExerciseIdSet = new Set(selectedExerciseIds);
    const recentExerciseIdSet = new Set(recentExerciseIds);

    return exercises.some(
      exercise =>
        selectedExerciseIdSet.has(exercise.id) &&
        exerciseMatchesFilter(exercise, selectedFilter, recentExerciseIdSet) &&
        matchesExerciseSearch(exercise, normalizedQuery)
    );
  }, [
    committedQuery,
    exercises,
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

  const selectExercise = useCallback(
    (exercise: ExerciseListItem) => {
      if (!isMultiple) {
        onSelectExercise?.(exercise);

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
    },
    [isMultiple, onSelectExercise]
  );

  const addPendingExercises = useCallback(() => {
    if (!isMultiple || pendingExercises.length === 0) {
      return;
    }

    onSelectExercises?.(pendingExercises);
    onClose();
  }, [isMultiple, onClose, onSelectExercises, pendingExercises]);

  const createCustomExercise = useCallback(() => {
    if (isMultiple && pendingExercises.length > 0) {
      onSelectExercises?.(pendingExercises);
    }

    onCreateCustomExercise(latestQueryRef.current.trim());
  }, [isMultiple, onCreateCustomExercise, onSelectExercises, pendingExercises]);

  const keyExtractor = useCallback(
    (item: ExerciseListDataItem) =>
      item.type === 'section-header' ? item.id : item.exercise.id,
    []
  );
  const renderExerciseItem = useCallback<ListRenderItem<ExerciseListDataItem>>(
    ({ item }) => {
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
          isSelected={pendingExerciseIdSet.has(item.exercise.id)}
          onPress={selectExercise}
        />
      );
    },
    [pendingExerciseIdSet, selectExercise]
  );

  return (
    <>
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
            <Icon as={XIcon} size="lg" tone="foreground" />
          </Button>
        </View>
      </BottomSheetHeader>

      <View className="px-4 pb-3">
        <ExercisePickerSearchInput
          isOpen={isOpen}
          onChangeQuery={handleQueryChange}
          onCommitQuery={setCommittedQuery}
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

      {isLoading ? (
        <View className="flex-1 px-4">
          <LoadingState label="Loading exercises..." />
        </View>
      ) : (
        <StyledBottomSheetFlatList
          data={listData}
          keyExtractor={keyExtractor}
          contentContainerClassName="px-4 pb-4"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          onTouchStart={Keyboard.dismiss}
          initialNumToRender={14}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={renderExerciseItem}
          windowSize={7}
          ListEmptyComponent={
            <EmptyState
              layout="section"
              title={emptyTitle}
              description={emptyDescription}
              className="border-border bg-card mt-3 rounded-lg border border-dashed px-6 py-10"
            />
          }
        />
      )}

      <View className="border-border bg-card pb-safe gap-2 border-t px-4 pt-3">
        <Button
          variant="secondary"
          leftIcon={<Icon as={PlusIcon} tone="secondaryForeground" />}
          onPress={createCustomExercise}
        >
          {createButtonLabel}
        </Button>
        {isMultiple && (
          <Button
            disabled={pendingExercises.length === 0}
            leftIcon={<Icon as={PlusIcon} tone="primaryForeground" />}
            onPress={addPendingExercises}
          >
            {addButtonLabel}
          </Button>
        )}
      </View>
    </>
  );
});

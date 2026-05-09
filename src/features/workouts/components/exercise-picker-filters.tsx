import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { ChoiceChip } from '@/src/components/ui/chip';
import {
  CATEGORY_FILTERS,
  type ExerciseCategory
} from '@/src/features/exercises/constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, type ScrollView } from 'react-native';

export type ExercisePickerFilter =
  | 'all'
  | 'recent'
  | 'custom'
  | ExerciseCategory;

interface ExercisePickerFilterOption {
  label: string;
  value: ExercisePickerFilter;
}

interface ExercisePickerFiltersProps {
  selectedFilter: ExercisePickerFilter;
  setSelectedFilter: (filter: ExercisePickerFilter) => void;
}

type CategoryOption = Extract<
  (typeof CATEGORY_FILTERS)[number],
  { readonly value: ExerciseCategory }
>;

const CATEGORY_OPTIONS = CATEGORY_FILTERS.filter(
  (category): category is CategoryOption => category.value !== 'all'
);

export function ExercisePickerFilters({
  selectedFilter,
  setSelectedFilter
}: ExercisePickerFiltersProps) {
  const filterScrollRef = useRef<ScrollView>(null);
  const filterLayoutsRef = useRef<
    Partial<Record<ExercisePickerFilter, { x: number; width: number }>>
  >({});
  const [filterViewportWidth, setFilterViewportWidth] = useState(0);
  const visibleFilters: ExercisePickerFilterOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Recent', value: 'recent' },
    { label: 'Custom', value: 'custom' },
    ...CATEGORY_OPTIONS
  ];

  const scrollFilterIntoView = useCallback(
    (filter: ExercisePickerFilter) => {
      const filterItemLayout = filterLayoutsRef.current[filter];

      if (!filterItemLayout || filterViewportWidth === 0) {
        return;
      }

      const centeredX =
        filterItemLayout.x +
        filterItemLayout.width / 2 -
        filterViewportWidth / 2;

      filterScrollRef.current?.scrollTo({
        x: Math.max(0, centeredX),
        animated: true
      });
    },
    [filterViewportWidth]
  );

  useEffect(() => {
    scrollFilterIntoView(selectedFilter);
  }, [selectedFilter, scrollFilterIntoView]);

  return (
    <StyledScrollView
      ref={filterScrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4"
      contentContainerClassName="gap-2 pr-4"
      onLayout={event => {
        setFilterViewportWidth(event.nativeEvent.layout.width);
      }}
    >
      {visibleFilters.map(filter => {
        const isSelected = filter.value === selectedFilter;

        return (
          <View
            key={filter.value}
            onLayout={event => {
              filterLayoutsRef.current[filter.value] = event.nativeEvent.layout;
            }}
          >
            <ChoiceChip
              selected={isSelected}
              onPress={() => setSelectedFilter(filter.value)}
              textClassName={isSelected ? 'text-foreground' : undefined}
            >
              {filter.label}
            </ChoiceChip>
          </View>
        );
      })}
    </StyledScrollView>
  );
}

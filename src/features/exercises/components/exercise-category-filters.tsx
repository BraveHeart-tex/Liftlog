import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { ChoiceChip } from '@/src/components/ui/chip';
import {
  CATEGORY_FILTERS,
  type CategoryFilter
} from '@/src/features/exercises/constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, type ScrollView } from 'react-native';

interface ExerciseCategoryFiltersProps {
  selectedCategory: CategoryFilter;
  setSelectedCategory: (categoryValue: CategoryFilter) => void;
  shouldShowCustomExerciseFilter: boolean;
}

export const ExerciseCategoryFilters = ({
  selectedCategory,
  setSelectedCategory,
  shouldShowCustomExerciseFilter
}: ExerciseCategoryFiltersProps) => {
  const categoryScrollRef = useRef<ScrollView>(null);
  const categoryLayoutsRef = useRef<
    Partial<Record<CategoryFilter, { x: number; width: number }>>
  >({});
  const [categoryViewportWidth, setCategoryViewportWidth] = useState(0);
  const visibleCategoryFilters = shouldShowCustomExerciseFilter
    ? [
        CATEGORY_FILTERS[0],
        { label: 'Custom', value: 'custom' as const },
        ...CATEGORY_FILTERS.slice(1)
      ]
    : CATEGORY_FILTERS;

  const scrollCategoryIntoView = useCallback(
    (category: CategoryFilter) => {
      const filterItemLayout = categoryLayoutsRef.current[category];

      if (!filterItemLayout || categoryViewportWidth === 0) {
        return;
      }

      const centeredX =
        filterItemLayout.x +
        filterItemLayout.width / 2 -
        categoryViewportWidth / 2;

      categoryScrollRef.current?.scrollTo({
        x: Math.max(0, centeredX),
        animated: true
      });
    },
    [categoryViewportWidth]
  );

  useEffect(() => {
    scrollCategoryIntoView(selectedCategory);
  }, [selectedCategory, scrollCategoryIntoView]);

  return (
    <StyledScrollView
      ref={categoryScrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4"
      contentContainerClassName="gap-2 pr-4"
      onLayout={event => {
        setCategoryViewportWidth(event.nativeEvent.layout.width);
      }}
    >
      {visibleCategoryFilters.map(category => {
        const isSelected = category.value === selectedCategory;

        return (
          <View
            key={category.value}
            onLayout={event => {
              categoryLayoutsRef.current[category.value] =
                event.nativeEvent.layout;
            }}
          >
            <ChoiceChip
              selected={isSelected}
              className={isSelected ? 'bg-card border-border' : 'bg-background'}
              onPress={() => setSelectedCategory(category.value)}
              textClassName={isSelected ? 'text-foreground' : undefined}
            >
              {category.label}
            </ChoiceChip>
          </View>
        );
      })}
    </StyledScrollView>
  );
};

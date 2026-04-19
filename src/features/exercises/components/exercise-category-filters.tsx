import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Text } from '@/src/components/ui/text';
import {
  CATEGORY_FILTERS,
  type CategoryFilter
} from '@/src/features/exercises/constants';
import { cn } from '@/src/lib/utils/cn';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, type ScrollView } from 'react-native';

export const ExerciseCategoryFilters = ({
  selectedCategory,
  setSelectedCategory
}: {
  selectedCategory: CategoryFilter;
  setSelectedCategory: (categoryValue: CategoryFilter) => void;
}) => {
  const categoryScrollRef = useRef<ScrollView>(null);
  const categoryLayoutsRef = useRef<
    Partial<Record<CategoryFilter, { x: number; width: number }>>
  >({});
  const [categoryViewportWidth, setCategoryViewportWidth] = useState(0);

  const scrollCategoryIntoView = useCallback(
    (category: CategoryFilter) => {
      const layout = categoryLayoutsRef.current[category];

      if (!layout || categoryViewportWidth === 0) {
        return;
      }

      const centeredX = layout.x - (categoryViewportWidth - layout.width) / 2;

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
      {CATEGORY_FILTERS.map(category => {
        const isSelected = category.value === selectedCategory;

        return (
          <Pressable
            key={category.value}
            onLayout={event => {
              categoryLayoutsRef.current[category.value] =
                event.nativeEvent.layout;
            }}
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
  );
};

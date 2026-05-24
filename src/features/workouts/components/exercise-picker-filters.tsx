import { StyledGestureScrollView } from '@/src/components/styled/scroll-view';
import { ChoiceChip } from '@/src/components/ui/chip';
import {
  CATEGORY_FILTERS,
  type ExerciseCategory
} from '@/src/features/exercises/constants';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef
} from 'react';
import { View } from 'react-native';

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
  const filterScrollRef =
    useRef<ComponentRef<typeof StyledGestureScrollView>>(null);
  const filterLayoutsRef = useRef<
    Partial<Record<ExercisePickerFilter, { x: number; width: number }>>
  >({});
  const [filterViewportWidth, setFilterViewportWidth] = useState(0);
  const [filterLayoutVersion, setFilterLayoutVersion] = useState(0);
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
    const animationFrame = requestAnimationFrame(() => {
      scrollFilterIntoView(selectedFilter);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [filterLayoutVersion, selectedFilter, scrollFilterIntoView]);

  return (
    <StyledGestureScrollView
      ref={filterScrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      className="mt-4"
      contentContainerClassName="gap-2 pr-4"
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
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
              const nextLayout = event.nativeEvent.layout;
              const previousLayout = filterLayoutsRef.current[filter.value];

              filterLayoutsRef.current[filter.value] = nextLayout;

              if (
                previousLayout?.x !== nextLayout.x ||
                previousLayout?.width !== nextLayout.width
              ) {
                setFilterLayoutVersion(version => version + 1);
              }
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
    </StyledGestureScrollView>
  );
}

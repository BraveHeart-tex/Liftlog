import { StyledGestureScrollView } from '@/src/components/styled/scroll-view';
import { ChoiceChip } from '@/src/components/ui/chip';
import type { IconComponent } from '@/src/components/ui/icon';
import { Icon } from '@/src/components/ui/icon';
import {
  CATEGORY_FILTERS,
  type ExerciseCategory
} from '@/src/features/exercises/constants';
import { UserIcon } from 'lucide-react-native';
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
  icon?: IconComponent;
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
  const leadingFilters: ExercisePickerFilterOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Recent', value: 'recent' },
    { label: 'Custom', value: 'custom', icon: UserIcon }
  ];

  const renderFilter = (filter: ExercisePickerFilterOption) => {
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
          leftIcon={
            filter.icon ? (
              <Icon
                icon={filter.icon}
                size="sm"
                className={
                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                }
              />
            ) : undefined
          }
          textClassName={isSelected ? 'text-foreground' : undefined}
        >
          {filter.label}
        </ChoiceChip>
      </View>
    );
  };

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
      {leadingFilters.map(renderFilter)}
      <View className="justify-center px-1" pointerEvents="none">
        <View className="bg-border h-6 w-px" />
      </View>
      {CATEGORY_OPTIONS.map(renderFilter)}
    </StyledGestureScrollView>
  );
}

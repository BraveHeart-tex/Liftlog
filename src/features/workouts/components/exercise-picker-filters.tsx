import { StyledGestureScrollView } from '@/src/components/styled/scroll-view';
import { ChoiceChip } from '@/src/components/ui/chip';
import type { IconComponent } from '@/src/components/ui/icon';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import {
  CATEGORY_FILTERS,
  type ExerciseCategory
} from '@/src/features/exercises/exercise.constants';
import type {
  ExercisePickerEquipmentFilter,
  ExercisePickerPrimaryFilter
} from '@/src/features/workouts/components/exercise-picker-filter.types';
import { ChevronDownIcon, ListFilterIcon } from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef
} from 'react';
import { View } from 'react-native';

export type ExercisePickerFilter =
  | ExercisePickerPrimaryFilter
  | ExerciseCategory;

interface ExercisePickerFilterOption {
  label: string;
  value: ExercisePickerFilter;
  icon?: IconComponent;
}

interface ExercisePickerFiltersProps {
  selectedFilter: ExercisePickerFilter;
  setSelectedFilter: (filter: ExercisePickerFilter) => void;
  selectedEquipment?: ExercisePickerEquipmentFilter;
  onOpenEquipmentSheet?: () => void;
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
  setSelectedFilter,
  selectedEquipment,
  onOpenEquipmentSheet
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
    { label: 'Custom', value: 'custom' }
  ];
  const isEquipmentSheetMode = onOpenEquipmentSheet !== undefined;
  const hasSelectedEquipment = selectedEquipment != null;
  const equipmentLabel =
    CATEGORY_FILTERS.find(category => category.value === selectedEquipment)
      ?.label ?? 'Equipment';

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
                as={filter.icon}
                size="sm"
                tone={isSelected ? 'primaryForeground' : 'mutedForeground'}
              />
            ) : undefined
          }
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
      {isEquipmentSheetMode ? (
        <ChoiceChip
          selected={hasSelectedEquipment}
          onPress={onOpenEquipmentSheet}
          className={
            hasSelectedEquipment
              ? 'border-primary-subtle-border bg-primary-subtle'
              : undefined
          }
          leftIcon={
            <Icon
              as={ListFilterIcon}
              size="sm"
              tone={hasSelectedEquipment ? 'primary' : 'mutedForeground'}
            />
          }
        >
          <Text
            variant="small"
            weight="medium"
            tone="inherit"
            className={
              hasSelectedEquipment ? 'text-primary' : 'text-muted-foreground'
            }
          >
            {equipmentLabel}
          </Text>
          <Icon
            as={ChevronDownIcon}
            size="sm"
            tone={hasSelectedEquipment ? 'primary' : 'mutedForeground'}
          />
        </ChoiceChip>
      ) : (
        CATEGORY_OPTIONS.map(renderFilter)
      )}
    </StyledGestureScrollView>
  );
}

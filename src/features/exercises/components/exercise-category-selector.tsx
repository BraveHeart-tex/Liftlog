import { ChoiceChip } from '@/src/components/ui/chip';
import { Text } from '@/src/components/ui/text';
import {
  CATEGORY_FILTERS,
  type ExerciseCategory
} from '@/src/features/exercises/exercise.constants';
import { View } from 'react-native';

type CategoryOption = Extract<
  (typeof CATEGORY_FILTERS)[number],
  { readonly value: ExerciseCategory }
>;

const CATEGORY_OPTIONS = CATEGORY_FILTERS.filter(
  (category): category is CategoryOption => category.value !== 'all'
);

interface ExerciseCategorySelectorProps {
  category: ExerciseCategory;
  hasNameField: boolean;
  onSelectCategory: (category: ExerciseCategory) => void;
}

export function ExerciseCategorySelector({
  category,
  hasNameField,
  onSelectCategory
}: ExerciseCategorySelectorProps) {
  return (
    <View className={hasNameField ? 'mt-6' : undefined}>
      <Text variant="overline">2. Category</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {CATEGORY_OPTIONS.map(categoryOption => (
          <ChoiceChip
            key={categoryOption.value}
            selected={category === categoryOption.value}
            onPress={() => onSelectCategory(categoryOption.value)}
          >
            {categoryOption.label}
          </ChoiceChip>
        ))}
      </View>
    </View>
  );
}

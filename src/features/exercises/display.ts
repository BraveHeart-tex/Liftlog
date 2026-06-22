import { CATEGORY_FILTERS } from '@/src/features/exercises/constants';
import type { ExerciseListItem } from '@/src/features/exercises/repository';

export interface ExerciseListSectionHeaderItem {
  type: 'section-header';
  id: string;
  title: string;
}

export interface ExerciseListRowItem {
  type: 'exercise';
  exercise: ExerciseListItem;
}

export type ExerciseListDataItem =
  | ExerciseListSectionHeaderItem
  | ExerciseListRowItem;

const categoryLabelByValue = new Map<string, string>(
  CATEGORY_FILTERS.map(category => [category.value, category.label])
);

function getExerciseCategoryLabel(category: ExerciseListItem['category']) {
  return categoryLabelByValue.get(category) ?? category;
}

export function buildAlphabetizedExerciseListItems(
  exercises: ExerciseListItem[]
): ExerciseListDataItem[] {
  const items: ExerciseListDataItem[] = [];
  let currentLetter = '';

  exercises.forEach(exercise => {
    const letter = exercise.name.trim().charAt(0).toUpperCase() || '#';

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
}

export function matchesExerciseSearch(
  exercise: ExerciseListItem,
  normalizedQuery: string
) {
  if (normalizedQuery.length === 0) {
    return true;
  }

  const searchableValues = [
    exercise.name,
    exercise.category,
    getExerciseCategoryLabel(exercise.category),
    ...(exercise.isCustom === 1 ? ['custom'] : [])
  ];

  return searchableValues.some(value =>
    value.toLocaleLowerCase().includes(normalizedQuery)
  );
}

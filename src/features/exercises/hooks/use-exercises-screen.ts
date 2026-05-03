import type { CategoryFilter } from '@/src/features/exercises/constants';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { useEffect, useMemo, useState } from 'react';
import { useExercises } from './use-exercises';

function matchesExerciseCategory(
  exercise: ExerciseListItem,
  selectedCategory: CategoryFilter
) {
  switch (selectedCategory) {
    case 'all':
      return true;
    case 'custom':
      return exercise.isCustom === 1;
    default:
      return exercise.category.toLocaleLowerCase() === selectedCategory;
  }
}

export function useExercisesScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');

  const exercises = useExercises();
  const hasCustomExercise = useMemo(
    () => exercises.some(exercise => exercise.isCustom === 1),
    [exercises]
  );

  useEffect(() => {
    if (!hasCustomExercise && selectedCategory === 'custom') {
      setSelectedCategory('all');
    }
  }, [hasCustomExercise, selectedCategory]);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return exercises.filter(exercise => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        exercise.name.toLocaleLowerCase().includes(normalizedQuery);

      const matchesCategory = matchesExerciseCategory(
        exercise,
        selectedCategory
      );

      return matchesQuery && matchesCategory;
    });
  }, [exercises, query, selectedCategory]);

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    exercises,
    filteredExercises,
    hasCustomExercise
  };
}

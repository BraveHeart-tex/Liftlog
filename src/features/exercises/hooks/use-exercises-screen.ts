import type { CategoryFilter } from '@/src/features/exercises/constants';
import { useMemo, useState } from 'react';
import { useExercises } from './use-exercises';

export function useExercisesScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const exercises = useExercises();

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return exercises.filter(exercise => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        exercise.name.toLocaleLowerCase().includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === 'all' ||
        exercise.category.toLocaleLowerCase() === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [exercises, query, selectedCategory]);

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    exercises,
    filteredExercises
  };
}

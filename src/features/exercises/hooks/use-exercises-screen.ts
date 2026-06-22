import { useDrizzle } from '@/src/components/database-provider';
import {
  buildAlphabetizedExerciseListItems,
  matchesExerciseSearch
} from '@/src/features/exercises/display';
import {
  getExercisesQuery,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import type { ExercisePickerFilter } from '@/src/features/workouts/components/exercise-picker-filters';
import { getRecentExerciseIdsQuery } from '@/src/features/workouts/repository';
import { RECENT_EXERCISES_LIMIT } from '@/src/features/workouts/workout.constants';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useEffect, useMemo, useState } from 'react';

function matchesExerciseFilter(
  exercise: ExerciseListItem,
  selectedFilter: ExercisePickerFilter,
  recentExerciseIdSet: Set<ExerciseListItem['id']>
) {
  switch (selectedFilter) {
    case 'all':
      return true;
    case 'recent':
      return recentExerciseIdSet.has(exercise.id);
    case 'custom':
      return exercise.isCustom === 1;
    default:
      return exercise.category.toLocaleLowerCase() === selectedFilter;
  }
}

export function useExercisesScreen() {
  const db = useDrizzle();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<ExercisePickerFilter>('all');

  const exercisesResult = useLiveWithFallback(getExercisesQuery(db), [db], {
    initialData: [],
    deferInitialRead: true,
    waitForInteractions: true
  });
  const exercises = exercisesResult.data;
  const shouldLoadRecentExercises = selectedFilter === 'recent';
  const recentExerciseResult = useLiveWithFallback(
    getRecentExerciseIdsQuery(db, [], RECENT_EXERCISES_LIMIT),
    [db, shouldLoadRecentExercises],
    {
      enabled: shouldLoadRecentExercises,
      fallbackData: [],
      deferInitialRead: true,
      waitForInteractions: true
    }
  );
  const recentExerciseIdSet = useMemo(
    () =>
      new Set(
        recentExerciseResult.data.map(
          recentExercise => recentExercise.exerciseId
        )
      ),
    [recentExerciseResult.data]
  );
  const hasCustomExercise = useMemo(
    () => exercises.some(exercise => exercise.isCustom === 1),
    [exercises]
  );

  useEffect(() => {
    if (!hasCustomExercise && selectedFilter === 'custom') {
      setSelectedFilter('all');
    }
  }, [hasCustomExercise, selectedFilter]);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return exercises.filter(exercise => {
      const matchesFilter = matchesExerciseFilter(
        exercise,
        selectedFilter,
        recentExerciseIdSet
      );

      return matchesExerciseSearch(exercise, normalizedQuery) && matchesFilter;
    });
  }, [exercises, query, recentExerciseIdSet, selectedFilter]);

  const exerciseListItems = useMemo(
    () => buildAlphabetizedExerciseListItems(filteredExercises),
    [filteredExercises]
  );
  const exerciseLoadError = exercisesResult.error ?? recentExerciseResult.error;
  const isLoadingExercises = !exercisesResult.isLive && !exercisesResult.error;
  const isLoadingRecentExercises =
    shouldLoadRecentExercises &&
    !recentExerciseResult.isLive &&
    !recentExerciseResult.error;

  return {
    query,
    setQuery,
    selectedFilter,
    setSelectedFilter,
    exercises,
    filteredExercises,
    exerciseListItems,
    hasCustomExercise,
    exerciseLoadError,
    isLoadingExercises,
    isLoadingRecentExercises
  };
}

import { useDrizzle } from '@/src/providers/database-provider';
import {
  buildAlphabetizedExerciseListItems,
  matchesExerciseSearch
} from '@/src/features/exercises/exercise-display.utils';
import {
  getExercisesQuery,
  type ExerciseListItem
} from '@/src/features/exercises/exercise.repository';
import type {
  ExercisePickerEquipmentFilter,
  ExercisePickerPrimaryFilter
} from '@/src/features/workouts/exercise-selection/components/exercise-picker-filter.types';
import { getRecentExerciseIdsQuery } from '@/src/features/workouts/exercise-selection/exercise-selection.repository';
import { matchesExercisePickerFilters } from '@/src/features/workouts/exercise-selection/exercise-picker-filter.utils';
import { RECENT_EXERCISES_LIMIT } from '@/src/features/workouts/shared/workout.constants';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo, useState } from 'react';

function matchesExerciseFilter(
  exercise: ExerciseListItem,
  selectedFilter: ExercisePickerPrimaryFilter,
  selectedEquipment: ExercisePickerEquipmentFilter,
  recentExerciseIdSet: Set<ExerciseListItem['id']>
) {
  return matchesExercisePickerFilters(
    exercise,
    selectedFilter,
    selectedEquipment,
    recentExerciseIdSet
  );
}

export function useExercisesScreen() {
  const db = useDrizzle();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<ExercisePickerPrimaryFilter>('all');
  const [selectedEquipment, setSelectedEquipment] =
    useState<ExercisePickerEquipmentFilter>(null);

  const exercisesResult = useLiveWithFallback(getExercisesQuery(db), [db], {
    initialData: [],
    deferInitialRead: true,
    waitForInteractions: true,
    operation: 'exercise.getExercises'
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
      waitForInteractions: true,
      operation: 'workout.getRecentExerciseIds'
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
  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return exercises.filter(exercise => {
      const matchesFilter = matchesExerciseFilter(
        exercise,
        selectedFilter,
        selectedEquipment,
        recentExerciseIdSet
      );

      return matchesExerciseSearch(exercise, normalizedQuery) && matchesFilter;
    });
  }, [
    exercises,
    query,
    recentExerciseIdSet,
    selectedEquipment,
    selectedFilter
  ]);

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
    selectedEquipment,
    setSelectedEquipment,
    exercises,
    filteredExercises,
    exerciseListItems,
    exerciseLoadError,
    isLoadingExercises,
    isLoadingRecentExercises
  };
}

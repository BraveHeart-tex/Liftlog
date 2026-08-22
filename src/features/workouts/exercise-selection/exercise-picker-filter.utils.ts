import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import type {
  ExercisePickerEquipmentFilter,
  ExercisePickerPrimaryFilter
} from '@/src/features/workouts/exercise-selection/components/exercise-picker-filter.types';

export function matchesExercisePickerFilters(
  exercise: ExerciseListItem,
  selectedFilter: ExercisePickerPrimaryFilter,
  selectedEquipment: ExercisePickerEquipmentFilter,
  recentExerciseIdSet: Set<ExerciseListItem['id']>
) {
  const matchesPrimaryFilter =
    selectedFilter === 'all' ||
    (selectedFilter === 'recent'
      ? recentExerciseIdSet.has(exercise.id)
      : exercise.isCustom === 1);

  return (
    matchesPrimaryFilter &&
    (selectedEquipment === null || exercise.category === selectedEquipment)
  );
}

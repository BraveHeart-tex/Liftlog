import type { ExerciseCategory } from '@/src/features/exercises/exercise.constants';

export type ExercisePickerPrimaryFilter = 'all' | 'recent' | 'custom';

export type ExercisePickerEquipmentFilter = ExerciseCategory | null;

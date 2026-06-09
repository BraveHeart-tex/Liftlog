import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplateExercise } from '@/src/db/schema';
import { createWorkoutTemplate } from '@/src/features/workouts/repository';
import { useCallback } from 'react';

export function useSaveWorkoutTemplate() {
  const db = useDrizzle();

  return useCallback(
    (
      name: string,
      exerciseRows: Pick<WorkoutTemplateExercise, 'exerciseId' | 'order'>[]
    ) =>
      createWorkoutTemplate(db, {
        name,
        exerciseRows
      }),
    [db]
  );
}

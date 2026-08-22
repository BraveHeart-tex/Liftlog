import { showSnackbar } from '@/src/components/ui/snackbar';
import { useDrizzle } from '@/src/providers/database-provider';
import type { Workout, WorkoutTemplateExercise } from '@/src/db/schema';
import { createWorkoutTemplate } from '@/src/features/workouts/templates/workout-template.repository';
import { triggerHapticSuccess } from '@/src/lib/haptics/haptics';
import { useCallback } from 'react';

export function useSaveWorkoutTemplate() {
  const db = useDrizzle();

  return useCallback(
    (
      name: string,
      exerciseRows: Pick<
        WorkoutTemplateExercise,
        'exerciseId' | 'order' | 'supersetId'
      >[],
      sourceWorkoutId?: Workout['id']
    ) => {
      const template = createWorkoutTemplate(db, {
        name,
        exerciseRows,
        sourceWorkoutId
      });

      triggerHapticSuccess('template save');
      showSnackbar({ message: 'Template saved' });

      return template;
    },
    [db]
  );
}

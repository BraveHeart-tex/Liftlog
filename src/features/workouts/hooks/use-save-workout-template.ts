import { showSnackbar } from '@/src/components/ui/snackbar';
import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplateExercise } from '@/src/db/schema';
import { createWorkoutTemplate } from '@/src/features/workouts/repository';
import { NotificationFeedbackType, notificationAsync } from 'expo-haptics';
import { useCallback } from 'react';

export function useSaveWorkoutTemplate() {
  const db = useDrizzle();

  return useCallback(
    (
      name: string,
      exerciseRows: Pick<WorkoutTemplateExercise, 'exerciseId' | 'order'>[]
    ) => {
      const template = createWorkoutTemplate(db, {
        name,
        exerciseRows
      });

      void notificationAsync(NotificationFeedbackType.Success);
      showSnackbar({ message: 'Template saved' });

      return template;
    },
    [db]
  );
}
